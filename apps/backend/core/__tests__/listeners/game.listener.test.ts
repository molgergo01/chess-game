const mockGameService = {
    getGameId: jest.fn(),
    getTimes: jest.fn(),
    move: jest.fn(),
    getFen: jest.fn(),
    isGameOver: jest.fn(),
    getWinner: jest.fn(),
    reset: jest.fn()
};

const mockGameNotificationService = {
    sendPositionUpdateNotification: jest.fn()
};

const mockGameController = {
    createGame: jest.fn()
};

const mockTimerWatcher = {
    start: jest.fn()
};

import { NextFunction, Request, Response } from 'express';
import { createServer, Server as NodeServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { Server, type Socket as ServerSocket } from 'socket.io';
import gameListener from '../../src/listeners/game.listener';
import { RatingChange, Winner } from '../../src/models/game';
import { MoveCallback } from '../../src/models/callbacks';

jest.mock('chess-game-backend-common/config/passport', () => ({
    initialize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next())
}));

jest.mock('../../src/services/game.service');
jest.mock('../../src/services/game.notification.service');
jest.mock('../../src/controllers/game.controller');
jest.mock('../../src/services/timer.watcher');
jest.mock('../../src/config/container', () => ({
    get: jest.fn((service) => {
        if (service.name === 'GameService') return mockGameService;
        if (service.name === 'GameNotificationService') return mockGameNotificationService;
        if (service.name === 'GameController') return mockGameController;
        if (service.name === 'TimerWatcher') return mockTimerWatcher;
        return null;
    }),
    bind: jest.fn().mockReturnThis(),
    toConstantValue: jest.fn()
}));

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
                const { joinGame, movePiece } = gameListener(io, socket);

                socket.on('joinGame', joinGame);
                socket.on('movePiece', movePiece);
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
    });

    describe('movePiece', () => {
        it('should send notification when move is valid', async () => {
            const newFen = 'new_fen_after_move';
            const playerTimes = {
                whiteTimeRemaining: 590000,
                blackTimeRemaining: 600000
            };

            mockGameService.getFen.mockResolvedValue('initial_fen');
            mockGameService.move.mockResolvedValue(newFen);
            mockGameService.isGameOver.mockResolvedValue(false);
            mockGameService.getWinner.mockResolvedValue(null);
            mockGameService.getTimes.mockResolvedValue(playerTimes);

            clientSocket.emit('movePiece', {
                gameId,
                from: 'e2',
                to: 'e4',
                promotionPiece: undefined
            });

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mockGameService.move).toHaveBeenCalledWith(
                userId,
                gameId,
                'e2',
                'e4',
                undefined,
                expect.any(Number)
            );
            expect(mockGameNotificationService.sendPositionUpdateNotification).toHaveBeenCalledWith(
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
            mockGameService.getFen.mockResolvedValue(currentFen);
            mockGameService.move.mockRejectedValue(new Error('Invalid move'));

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
            expect(mockGameService.move).toHaveBeenCalled();
            expect(mockGameNotificationService.sendPositionUpdateNotification).not.toHaveBeenCalled();
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

            mockGameService.getFen.mockResolvedValue('fen');
            mockGameService.move.mockResolvedValue(finalFen);
            mockGameService.isGameOver.mockResolvedValue(true);
            mockGameService.getWinner.mockResolvedValue(Winner.BLACK);
            mockGameService.getTimes.mockResolvedValue(playerTimes);
            mockGameService.reset.mockResolvedValue(ratingChange);

            clientSocket.emit('movePiece', {
                gameId,
                from: 'e7',
                to: 'e5',
                promotionPiece: undefined
            });

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mockGameService.isGameOver).toHaveBeenCalledWith(gameId);
            expect(mockGameService.reset).toHaveBeenCalledWith(gameId);
            expect(mockGameNotificationService.sendPositionUpdateNotification).toHaveBeenCalledWith(
                gameId,
                finalFen,
                true,
                Winner.BLACK,
                playerTimes,
                ratingChange
            );
        });
    });
});
