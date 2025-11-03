import { ChatMessage } from '../../src/models/chat';
import { NextFunction, Request, Response } from 'express';
import { createServer, Server as NodeServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { Server, type Socket as ServerSocket } from 'socket.io';
import { Color, RatingChange, Winner } from '../../src/models/game';
import { MoveCallback } from '../../src/models/callbacks';

const mocks = {
    gameService: {
        getGameId: jest.fn(),
        getTimes: jest.fn(),
        move: jest.fn(),
        getFen: jest.fn(),
        isGameOver: jest.fn(),
        getWinner: jest.fn(),
        reset: jest.fn(),
        resign: jest.fn(),
        offerDraw: jest.fn(),
        respondDrawOffer: jest.fn(),
        getPlayerColor: jest.fn()
    },
    gameNotificationService: {
        sendPositionUpdateNotification: jest.fn(),
        sendGameOverNotification: jest.fn(),
        sendDrawOfferedNotification: jest.fn(),
        sendDrawOfferRejectedNotification: jest.fn()
    },
    chatService: {
        createSystemChatMessage: jest.fn(),
        getChatMessages: jest.fn()
    },
    chatNotificationService: {
        sendChatMessagesUpdatedNotification: jest.fn()
    },
    gameController: {
        createGame: jest.fn()
    },
    timerWatcher: {
        start: jest.fn()
    }
};

jest.mock('chess-game-backend-common/config/passport', () => ({
    initialize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next())
}));

jest.mock('../../src/services/game.service');
jest.mock('../../src/services/game.notification.service');
jest.mock('../../src/services/chat.service');
jest.mock('../../src/services/chat.notification.service');
jest.mock('../../src/controllers/game.controller');
jest.mock('../../src/services/timer.watcher');
jest.mock('../../src/config/container', () => ({
    get: jest.fn((service) => {
        if (service.name === 'GameService') return mocks.gameService;
        if (service.name === 'GameNotificationService') return mocks.gameNotificationService;
        if (service.name === 'ChatService') return mocks.chatService;
        if (service.name === 'ChatNotificationService') return mocks.chatNotificationService;
        if (service.name === 'GameController') return mocks.gameController;
        if (service.name === 'TimerWatcher') return mocks.timerWatcher;
        return null;
    }),
    bind: jest.fn().mockReturnThis(),
    toConstantValue: jest.fn()
}));

import gameListener from '../../src/listeners/game.listener';

describe('Game Listener', () => {
    let io: Server, clientSocket: ClientSocket;
    let httpServer: NodeServer;
    const userId = 'user123';
    const gameId = 'game456';

    beforeAll((done) => {
        httpServer = createServer();
        io = new Server(httpServer);
        httpServer.listen(() => {
            const port = (httpServer.address() as AddressInfo).port;
            clientSocket = ioc(`http://localhost:${port}`);
            io.on('connection', (socket: ServerSocket) => {
                socket.data.user = { id: userId };
                const { joinGame, movePiece, resign, offerDraw, respondDrawOffer } = gameListener(io, socket);

                socket.on('joinGame', joinGame);
                socket.on('movePiece', movePiece);
                socket.on('resign', resign);
                socket.on('offerDraw', offerDraw);
                socket.on('respondDrawOffer', respondDrawOffer);
            });
            clientSocket.on('connect', done);
        });
    });

    afterAll(async () => {
        clientSocket.disconnect();
        io.disconnectSockets();
        await io.close();
        httpServer.closeAllConnections();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('joinGame', () => {
        it('should join the game room', async () => {
            clientSocket.emit('joinGame', { gameId });

            await new Promise((resolve) => setTimeout(resolve, 100));

            const serverSocket = Array.from(io.sockets.sockets.values())[0];
            expect(serverSocket.rooms.has(gameId)).toBe(true);
        });

        it('should emit game-error event when socket.join throws error', (done) => {
            const errorMessage = 'Failed to join room';

            clientSocket.on('game-error', (error) => {
                expect(error).toEqual({
                    message: 'An unexpected error occurred',
                    code: undefined
                });
                done();
            });

            const serverSocket = Array.from(io.sockets.sockets.values())[0];
            const originalJoin = serverSocket.join.bind(serverSocket);
            serverSocket.join = jest.fn(() => {
                throw new Error(errorMessage);
            });

            clientSocket.emit('joinGame', { gameId });

            setTimeout(() => {
                serverSocket.join = originalJoin;
            }, 150);
        });
    });

    describe('movePiece', () => {
        it('should send notification when move is valid', async () => {
            const newFen = 'new_fen_after_move';
            const playerTimes = {
                whiteTimeRemaining: 590000,
                blackTimeRemaining: 600000
            };

            mocks.gameService.getFen.mockResolvedValue('initial_fen');
            mocks.gameService.move.mockResolvedValue(newFen);
            mocks.gameService.isGameOver.mockResolvedValue(false);
            mocks.gameService.getWinner.mockResolvedValue(null);
            mocks.gameService.getTimes.mockResolvedValue(playerTimes);

            clientSocket.emit('movePiece', {
                gameId,
                from: 'e2',
                to: 'e4',
                promotionPiece: undefined
            });

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mocks.gameService.move).toHaveBeenCalledWith(
                userId,
                gameId,
                'e2',
                'e4',
                undefined,
                expect.any(Number)
            );
            expect(mocks.gameNotificationService.sendPositionUpdateNotification).toHaveBeenCalledWith(
                gameId,
                newFen,
                false,
                null,
                playerTimes,
                null
            );
        });

        it('should return failure response when move is invalid', async () => {
            const currentFen = 'current_fen';
            mocks.gameService.getFen.mockResolvedValue(currentFen);
            mocks.gameService.move.mockRejectedValue(new Error('Invalid move'));

            const result: MoveCallback = await clientSocket.emitWithAck('movePiece', {
                gameId,
                from: 'e2',
                to: 'e5',
                promotionPiece: undefined
            });

            expect(result).toEqual({
                success: false,
                position: currentFen
            });
            expect(mocks.gameService.move).toHaveBeenCalled();
            expect(mocks.gameNotificationService.sendPositionUpdateNotification).not.toHaveBeenCalled();
        });

        it('should reset game when game is over', async () => {
            const finalFen = 'final_fen';
            const playerTimes = {
                whiteTimeRemaining: 0,
                blackTimeRemaining: 600000
            };
            const ratingChange: RatingChange = {
                whiteRatingChange: 0,
                whiteNewRating: 400,
                blackRatingChange: 0,
                blackNewRating: 400
            };

            mocks.gameService.getFen.mockResolvedValue('fen');
            mocks.gameService.move.mockResolvedValue(finalFen);
            mocks.gameService.isGameOver.mockResolvedValue(true);
            mocks.gameService.getWinner.mockResolvedValue(Winner.BLACK);
            mocks.gameService.getTimes.mockResolvedValue(playerTimes);
            mocks.gameService.reset.mockResolvedValue(ratingChange);

            clientSocket.emit('movePiece', {
                gameId,
                from: 'e7',
                to: 'e5',
                promotionPiece: undefined
            });

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mocks.gameService.isGameOver).toHaveBeenCalledWith(gameId);
            expect(mocks.gameService.reset).toHaveBeenCalledWith(gameId);
            expect(mocks.gameNotificationService.sendPositionUpdateNotification).toHaveBeenCalledWith(
                gameId,
                finalFen,
                true,
                Winner.BLACK,
                playerTimes,
                ratingChange
            );
        });
    });

    describe('resign', () => {
        it('should log resignation message and send game over notification', async () => {
            const ratingChange: RatingChange = {
                whiteRatingChange: -10,
                whiteNewRating: 390,
                blackRatingChange: 10,
                blackNewRating: 410
            };
            const chatMessages: ChatMessage[] = [
                { messageId: '1', userId: 'SYSTEM', message: 'white resigned', timestamp: new Date() }
            ];

            mocks.gameService.getPlayerColor.mockResolvedValue(Color.WHITE);
            mocks.chatService.createSystemChatMessage.mockResolvedValue(undefined);
            mocks.chatService.getChatMessages.mockResolvedValue(chatMessages);
            mocks.gameService.resign.mockResolvedValue({ winner: Winner.BLACK, ratingChange });

            clientSocket.emit('resign', { gameId });

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mocks.gameService.getPlayerColor).toHaveBeenCalledWith(gameId, userId);
            expect(mocks.chatService.createSystemChatMessage).toHaveBeenCalledWith(gameId, 'white resigned');
            expect(mocks.chatService.getChatMessages).toHaveBeenCalledWith(gameId, userId);
            expect(mocks.chatNotificationService.sendChatMessagesUpdatedNotification).toHaveBeenCalledWith(
                gameId,
                chatMessages
            );
            expect(mocks.gameService.resign).toHaveBeenCalledWith(userId, gameId);
            expect(mocks.gameNotificationService.sendGameOverNotification).toHaveBeenCalledWith(
                gameId,
                Winner.BLACK,
                ratingChange
            );
        });

        it('should emit game-error event when resign fails', (done) => {
            mocks.gameService.getPlayerColor.mockRejectedValue(new Error('Player not found'));

            clientSocket.on('game-error', (error) => {
                expect(error).toEqual({
                    message: 'An unexpected error occurred',
                    code: undefined
                });
                expect(mocks.gameNotificationService.sendGameOverNotification).not.toHaveBeenCalled();
                done();
            });

            clientSocket.emit('resign', { gameId });
        });
    });

    describe('offerDraw', () => {
        it('should log draw offer message and send draw offered notification', async () => {
            const expiresAt = Date.now() + 30000;
            const drawOffer = { offeredBy: 'white', expiresAt };
            const chatMessages: ChatMessage[] = [
                { messageId: '1', userId: 'SYSTEM', message: 'white offered a draw', timestamp: new Date() }
            ];

            mocks.gameService.getPlayerColor.mockResolvedValue(Color.WHITE);
            mocks.chatService.createSystemChatMessage.mockResolvedValue(undefined);
            mocks.chatService.getChatMessages.mockResolvedValue(chatMessages);
            mocks.gameService.offerDraw.mockResolvedValue(drawOffer);

            clientSocket.emit('offerDraw', { gameId });

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mocks.gameService.getPlayerColor).toHaveBeenCalledWith(gameId, userId);
            expect(mocks.chatService.createSystemChatMessage).toHaveBeenCalledWith(gameId, 'white offered a draw');
            expect(mocks.chatService.getChatMessages).toHaveBeenCalledWith(gameId, userId);
            expect(mocks.chatNotificationService.sendChatMessagesUpdatedNotification).toHaveBeenCalledWith(
                gameId,
                chatMessages
            );
            expect(mocks.gameService.offerDraw).toHaveBeenCalledWith(gameId, userId);
            expect(mocks.gameNotificationService.sendDrawOfferedNotification).toHaveBeenCalledWith(
                gameId,
                drawOffer.offeredBy,
                drawOffer.expiresAt
            );
        });

        it('should emit game-error event when offerDraw fails', (done) => {
            mocks.gameService.getPlayerColor.mockRejectedValue(new Error('Draw offer failed'));

            clientSocket.on('game-error', (error) => {
                expect(error).toEqual({
                    message: 'An unexpected error occurred',
                    code: undefined
                });
                expect(mocks.gameNotificationService.sendDrawOfferedNotification).not.toHaveBeenCalled();
                done();
            });

            clientSocket.emit('offerDraw', { gameId });
        });
    });

    describe('respondDrawOffer', () => {
        it('should log accepted message and send game over notification when draw is accepted', async () => {
            const ratingChange: RatingChange = {
                whiteRatingChange: 0,
                whiteNewRating: 400,
                blackRatingChange: 0,
                blackNewRating: 400
            };
            const chatMessages: ChatMessage[] = [
                { messageId: '1', userId: 'SYSTEM', message: 'black accepted the draw request', timestamp: new Date() }
            ];

            mocks.gameService.getPlayerColor.mockResolvedValue(Color.BLACK);
            mocks.chatService.createSystemChatMessage.mockResolvedValue(undefined);
            mocks.chatService.getChatMessages.mockResolvedValue(chatMessages);
            mocks.gameService.respondDrawOffer.mockResolvedValue(ratingChange);

            clientSocket.emit('respondDrawOffer', { gameId, accepted: true });

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mocks.gameService.getPlayerColor).toHaveBeenCalledWith(gameId, userId);
            expect(mocks.chatService.createSystemChatMessage).toHaveBeenCalledWith(
                gameId,
                'black accepted the draw request'
            );
            expect(mocks.chatService.getChatMessages).toHaveBeenCalledWith(gameId, userId);
            expect(mocks.chatNotificationService.sendChatMessagesUpdatedNotification).toHaveBeenCalledWith(
                gameId,
                chatMessages
            );
            expect(mocks.gameService.respondDrawOffer).toHaveBeenCalledWith(gameId, userId, true);
            expect(mocks.gameNotificationService.sendGameOverNotification).toHaveBeenCalledWith(
                gameId,
                Winner.DRAW,
                ratingChange
            );
        });

        it('should log declined message and send draw offer rejected notification when draw is declined', async () => {
            const chatMessages: ChatMessage[] = [
                { messageId: '1', userId: 'SYSTEM', message: 'black declined the draw request', timestamp: new Date() }
            ];

            mocks.gameService.getPlayerColor.mockResolvedValue(Color.BLACK);
            mocks.chatService.createSystemChatMessage.mockResolvedValue(undefined);
            mocks.chatService.getChatMessages.mockResolvedValue(chatMessages);
            mocks.gameService.respondDrawOffer.mockResolvedValue(null);

            clientSocket.emit('respondDrawOffer', { gameId, accepted: false });

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mocks.gameService.getPlayerColor).toHaveBeenCalledWith(gameId, userId);
            expect(mocks.chatService.createSystemChatMessage).toHaveBeenCalledWith(
                gameId,
                'black declined the draw request'
            );
            expect(mocks.chatService.getChatMessages).toHaveBeenCalledWith(gameId, userId);
            expect(mocks.chatNotificationService.sendChatMessagesUpdatedNotification).toHaveBeenCalledWith(
                gameId,
                chatMessages
            );
            expect(mocks.gameService.respondDrawOffer).toHaveBeenCalledWith(gameId, userId, false);
            expect(mocks.gameNotificationService.sendDrawOfferRejectedNotification).toHaveBeenCalledWith(gameId);
            expect(mocks.gameNotificationService.sendGameOverNotification).not.toHaveBeenCalled();
        });

        it('should emit game-error event when respondDrawOffer fails', (done) => {
            mocks.gameService.getPlayerColor.mockRejectedValue(new Error('Respond draw offer failed'));

            clientSocket.on('game-error', (error) => {
                expect(error).toEqual({
                    message: 'An unexpected error occurred',
                    code: undefined
                });
                expect(mocks.gameNotificationService.sendGameOverNotification).not.toHaveBeenCalled();
                expect(mocks.gameNotificationService.sendDrawOfferRejectedNotification).not.toHaveBeenCalled();
                done();
            });

            clientSocket.emit('respondDrawOffer', { gameId, accepted: true });
        });
    });
});
