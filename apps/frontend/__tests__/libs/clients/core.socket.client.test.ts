import {
    getGameId,
    getTimes,
    joinGame,
    movePiece,
    getPosition
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

    describe('getGameId', () => {
        it('should call socket.emitWithAck with correct event name', async () => {
            const mockResponse = { gameId: 'game123' };
            (mockSocket.emitWithAck as jest.Mock).mockResolvedValue(
                mockResponse
            );

            const result = await getGameId(mockSocket as Socket);

            expect(mockSocket.emitWithAck).toHaveBeenCalledWith('getGameId');
            expect(result).toBe(mockResponse);
        });
    });

    describe('getTimes', () => {
        it('should call socket.emitWithAck with correct event name and request body', async () => {
            const gameId = 'game123';
            const mockResponse = {
                playerTimes: {
                    whiteTimeRemaining: 600000,
                    blackTimeRemaining: 600000
                }
            };
            (mockSocket.emitWithAck as jest.Mock).mockResolvedValue(
                mockResponse
            );

            const result = await getTimes(mockSocket as Socket, gameId);

            expect(mockSocket.emitWithAck).toHaveBeenCalledWith('getTimes', {
                gameId: gameId
            });
            expect(result).toBe(mockResponse);
        });
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

            (mockSocket.emitWithAck as jest.Mock).mockResolvedValue(
                mockResponse
            );

            const result = await movePiece(
                mockSocket as Socket,
                gameId,
                sourceSquare,
                targetSquare,
                promotionPiece
            );

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

            (mockSocket.emitWithAck as jest.Mock).mockResolvedValue(
                mockResponse
            );

            const result = await movePiece(
                mockSocket as Socket,
                gameId,
                sourceSquare,
                targetSquare,
                promotionPiece
            );

            expect(mockSocket.emitWithAck).toHaveBeenCalledWith('movePiece', {
                gameId: gameId,
                from: sourceSquare,
                to: targetSquare,
                promotionPiece: promotionPiece
            });
            expect(result).toBe(mockResponse);
        });
    });

    describe('getPosition', () => {
        it('should call socket.emitWithAck with correct event name and request body', async () => {
            const gameId = 'game123';
            const mockResponse = {
                position: 'fen_string',
                gameOver: false,
                winner: null
            };

            (mockSocket.emitWithAck as jest.Mock).mockResolvedValue(
                mockResponse
            );

            const result = await getPosition(mockSocket as Socket, gameId);

            expect(mockSocket.emitWithAck).toHaveBeenCalledWith('getPosition', {
                gameId: gameId
            });
            expect(result).toBe(mockResponse);
        });
    });
});
