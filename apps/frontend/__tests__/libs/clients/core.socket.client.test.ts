import {
    joinChat,
    joinGame,
    leaveChat,
    movePiece,
    offerDraw,
    resign,
    respondDrawOffer,
    sendChatMessage
} from '@/lib/clients/core.socket.client';
import { Socket } from 'socket.io-client';

describe('core.socket.client', () => {
    let mockSocket: Partial<Socket>;

    beforeEach(() => {
        mockSocket = {
            emitWithAck: jest.fn(),
            emit: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('joinGame', () => {
        it('should call socket.emit with correct event name and request body', () => {
            const gameId = 'game123';

            joinGame(mockSocket as Socket, gameId);

            expect(mockSocket.emit).toHaveBeenCalledWith('joinGame', {
                gameId: gameId
            });
        });
    });

    describe('movePiece', () => {
        it('should call socket.emitWithAck with correct event name and request body', async () => {
            const gameId = 'game123';
            const sourceSquare = 'e2';
            const targetSquare = 'e4';
            const promotionPiece = undefined;
            const mockResponse = { success: true, position: 'fen_string' };

            (mockSocket.emitWithAck as jest.Mock).mockResolvedValue(mockResponse);

            const result = await movePiece(mockSocket as Socket, gameId, sourceSquare, targetSquare, promotionPiece);

            expect(mockSocket.emitWithAck).toHaveBeenCalledWith('movePiece', {
                gameId: gameId,
                from: sourceSquare,
                to: targetSquare,
                promotionPiece: promotionPiece
            });
            expect(result).toBe(mockResponse);
        });

        it('should handle promotion piece when provided', async () => {
            const gameId = 'game123';
            const sourceSquare = 'e7';
            const targetSquare = 'e8';
            const promotionPiece = 'q';
            const mockResponse = { success: true, position: 'fen_string' };

            (mockSocket.emitWithAck as jest.Mock).mockResolvedValue(mockResponse);

            const result = await movePiece(mockSocket as Socket, gameId, sourceSquare, targetSquare, promotionPiece);

            expect(mockSocket.emitWithAck).toHaveBeenCalledWith('movePiece', {
                gameId: gameId,
                from: sourceSquare,
                to: targetSquare,
                promotionPiece: promotionPiece
            });
            expect(result).toBe(mockResponse);
        });
    });

    describe('resign', () => {
        it('should call socket.emit with correct event name and request body', async () => {
            const gameId = 'game123';

            await resign(mockSocket as Socket, gameId);

            expect(mockSocket.emit).toHaveBeenCalledWith('resign-game', {
                gameId: gameId
            });
        });
    });

    describe('offerDraw', () => {
        it('should call socket.emit with correct event name and request body', async () => {
            const gameId = 'game123';

            await offerDraw(mockSocket as Socket, gameId);

            expect(mockSocket.emit).toHaveBeenCalledWith('offer-draw', {
                gameId: gameId
            });
        });
    });

    describe('respondDrawOffer', () => {
        it('should call socket.emit with correct event name and request body when accepting', async () => {
            const gameId = 'game123';
            const accepted = true;

            await respondDrawOffer(mockSocket as Socket, gameId, accepted);

            expect(mockSocket.emit).toHaveBeenCalledWith('respond-draw-offer', {
                gameId: gameId,
                accepted: accepted
            });
        });

        it('should call socket.emit with correct event name and request body when declining', async () => {
            const gameId = 'game123';
            const accepted = false;

            await respondDrawOffer(mockSocket as Socket, gameId, accepted);

            expect(mockSocket.emit).toHaveBeenCalledWith('respond-draw-offer', {
                gameId: gameId,
                accepted: accepted
            });
        });
    });

    describe('joinChat', () => {
        it('should call socket.emitWithAck with correct event name and request body', async () => {
            const chatId = 'chat123';

            await joinChat(mockSocket as Socket, chatId);

            expect(mockSocket.emitWithAck).toHaveBeenCalledWith('join-chat', {
                chatId: chatId
            });
        });
    });

    describe('leaveChat', () => {
        it('should call socket.emit with correct event name and request body', () => {
            const chatId = 'chat123';

            leaveChat(mockSocket as Socket, chatId);

            expect(mockSocket.emit).toHaveBeenCalledWith('leave-chat', {
                chatId: chatId
            });
        });
    });

    describe('sendChatMessage', () => {
        it('should call socket.emit with correct event name and request body', async () => {
            const chatId = 'chat123';
            const message = 'Hello, world!';

            await sendChatMessage(mockSocket as Socket, chatId, message);

            expect(mockSocket.emit).toHaveBeenCalledWith('send-chat-message', {
                chatId: chatId,
                message: message
            });
        });
    });
});
