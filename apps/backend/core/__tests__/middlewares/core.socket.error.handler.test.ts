import { Server, Socket } from 'socket.io';
import { handleCoreSocketError } from '../../src/middlewares/core.socket.error.handler';
import InvalidMoveError from '../../src/errors/invalid.move.error';
import NotPlayersTurnError from '../../src/errors/not.players.turn.error';
import BadRequestError from 'chess-game-backend-common/errors/bad.request.error';
import NotFoundError from 'chess-game-backend-common/errors/not.found.error';

describe('Core Socket Error Handler', () => {
    let mockIo: jest.Mocked<Server>;
    let mockSocket: jest.Mocked<Socket>;
    let mockRoom: { emit: jest.Mock };
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        mockRoom = {
            emit: jest.fn()
        };

        mockIo = {
            to: jest.fn().mockReturnValue(mockRoom)
        } as unknown as jest.Mocked<Server>;

        mockSocket = {
            emit: jest.fn(),
            data: { user: { id: 'test-user-id' } }
        } as unknown as jest.Mocked<Socket>;

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('core-specific error handling', () => {
        it('should handle InvalidMoveError with INVALID_MOVE code', () => {
            const error = new InvalidMoveError('Invalid chess move');

            handleCoreSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'movePiece',
                    roomId: 'game-123'
                },
                'game-error'
            );

            expect(mockRoom.emit).toHaveBeenCalledWith('game-error', {
                message: 'Invalid chess move',
                code: 'INVALID_MOVE'
            });
        });

        it('should handle InvalidMoveError with default message', () => {
            const error = new InvalidMoveError();

            handleCoreSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'movePiece',
                    roomId: 'game-123'
                },
                'game-error'
            );

            expect(mockRoom.emit).toHaveBeenCalledWith('game-error', {
                message: 'Invalid Move',
                code: 'INVALID_MOVE'
            });
        });

        it('should handle NotPlayersTurnError with NOT_PLAYERS_TURN code', () => {
            const error = new NotPlayersTurnError('Wait for your turn');

            handleCoreSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'movePiece',
                    roomId: 'game-123'
                },
                'game-error'
            );

            expect(mockRoom.emit).toHaveBeenCalledWith('game-error', {
                message: 'Wait for your turn',
                code: 'NOT_PLAYERS_TURN'
            });
        });

        it('should handle NotPlayersTurnError with default message', () => {
            const error = new NotPlayersTurnError();

            handleCoreSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'movePiece',
                    roomId: 'game-123'
                },
                'game-error'
            );

            expect(mockRoom.emit).toHaveBeenCalledWith('game-error', {
                message: "Not player's turn",
                code: 'NOT_PLAYERS_TURN'
            });
        });
    });

    describe('fallback to base error handler', () => {
        it('should fallback to base handler for BadRequestError', () => {
            const error = new BadRequestError('Invalid input');

            handleCoreSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'testOp',
                    roomId: 'room-123'
                },
                'test-error'
            );

            expect(mockRoom.emit).toHaveBeenCalledWith('test-error', {
                message: 'Invalid input',
                code: 'BAD_REQUEST'
            });
        });

        it('should fallback to base handler for NotFoundError', () => {
            const error = new NotFoundError('Game not found');

            handleCoreSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'joinGame',
                    roomId: 'game-123'
                },
                'game-error'
            );

            expect(mockRoom.emit).toHaveBeenCalledWith('game-error', {
                message: 'Game not found',
                code: 'NOT_FOUND'
            });
        });

        it('should fallback to base handler for generic Error', () => {
            const error = new Error('Unknown error');

            handleCoreSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'testOp',
                    roomId: 'room-123'
                },
                'test-error'
            );

            expect(mockRoom.emit).toHaveBeenCalledWith('test-error', {
                message: 'An unexpected error occurred',
                code: undefined
            });
        });
    });

    describe('error logging', () => {
        it('should log core errors with context', () => {
            const error = new InvalidMoveError('Invalid move from e2 to e5');

            handleCoreSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'movePiece',
                    userId: 'user-123',
                    roomId: 'game-456',
                    from: 'e2',
                    to: 'e5'
                },
                'game-error'
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[movePiece] Socket error (operation=movePiece, userId=user-123, roomId=game-456, from=e2, to=e5): Invalid move from e2 to e5'
            );
        });
    });

    describe('error emission', () => {
        it('should emit core error to room when roomId is provided', () => {
            const error = new NotPlayersTurnError();

            handleCoreSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'movePiece',
                    roomId: 'game-123'
                },
                'game-error'
            );

            expect(mockIo.to).toHaveBeenCalledWith('game-123');
            expect(mockRoom.emit).toHaveBeenCalledWith('game-error', {
                message: "Not player's turn",
                code: 'NOT_PLAYERS_TURN'
            });
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit core error directly to socket when roomId is not provided', () => {
            const error = new InvalidMoveError();

            handleCoreSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'movePiece',
                    userId: 'user-123'
                },
                'game-error'
            );

            expect(mockIo.to).not.toHaveBeenCalled();
            expect(mockSocket.emit).toHaveBeenCalledWith('game-error', {
                message: 'Invalid Move',
                code: 'INVALID_MOVE'
            });
        });
    });
});
