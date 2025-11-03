import { Server, Socket } from 'socket.io';
import { handleSocketError } from '../../src/utils/socket-error.handler';
import BadRequestError from '../../src/errors/bad.request.error';
import UnauthorizedError from '../../src/errors/unauthorized.error';
import ForbiddenError from '../../src/errors/forbidden.error';
import NotFoundError from '../../src/errors/not.found.error';
import ConflictError from '../../src/errors/conflict.error';
import UnprocessableEntityError from '../../src/errors/unprocessable.entity.error';
import InternalServerError from '../../src/errors/internal.server.error';

describe('Socket Error Handler', () => {
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

    describe('error code mapping', () => {
        it('should map BadRequestError to BAD_REQUEST code', () => {
            const error = new BadRequestError('Invalid input');

            handleSocketError(
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

        it('should map UnauthorizedError to UNAUTHORIZED code', () => {
            const error = new UnauthorizedError('Not authorized');

            handleSocketError(
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
                message: 'Not authorized',
                code: 'UNAUTHORIZED'
            });
        });

        it('should map ForbiddenError to FORBIDDEN code', () => {
            const error = new ForbiddenError('Access denied');

            handleSocketError(
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
                message: 'Access denied',
                code: 'FORBIDDEN'
            });
        });

        it('should map NotFoundError to NOT_FOUND code', () => {
            const error = new NotFoundError('Resource not found');

            handleSocketError(
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
                message: 'Resource not found',
                code: 'NOT_FOUND'
            });
        });

        it('should map ConflictError to CONFLICT code', () => {
            const error = new ConflictError('Already exists');

            handleSocketError(
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
                message: 'Already exists',
                code: 'CONFLICT'
            });
        });

        it('should map UnprocessableEntityError to UNPROCESSABLE_ENTITY code', () => {
            const error = new UnprocessableEntityError('Validation failed');

            handleSocketError(
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
                message: 'Validation failed',
                code: 'UNPROCESSABLE_ENTITY'
            });
        });

        it('should map InternalServerError to INTERNAL_SERVER_ERROR code with generic message', () => {
            const error = new InternalServerError('Database failure');

            handleSocketError(
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
                message: 'An internal server error occurred',
                code: 'INTERNAL_SERVER_ERROR'
            });
        });

        it('should handle generic Error with no code', () => {
            const error = new Error('Unknown error');

            handleSocketError(
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
        it('should log error with operation and roomId context', () => {
            const error = new BadRequestError('Test error');

            handleSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'joinGame',
                    roomId: 'game-123'
                },
                'game-error'
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[joinGame] Socket error (operation=joinGame, roomId=game-123): Test error'
            );
        });

        it('should log error with userId context', () => {
            const error = new ForbiddenError('Not allowed');

            handleSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'movePiece',
                    userId: 'user-456',
                    roomId: 'game-789'
                },
                'game-error'
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[movePiece] Socket error (operation=movePiece, userId=user-456, roomId=game-789): Not allowed'
            );
        });

        it('should log error with additional context', () => {
            const error = new BadRequestError('Invalid move');

            handleSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'movePiece',
                    userId: 'user-123',
                    roomId: 'game-456',
                    from: 'e2',
                    to: 'e4'
                },
                'game-error'
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[movePiece] Socket error (operation=movePiece, userId=user-123, roomId=game-456, from=e2, to=e4): Invalid move'
            );
        });
    });

    describe('error emission', () => {
        it('should emit error to room when roomId is provided', () => {
            const error = new NotFoundError('Game not found');

            handleSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'joinGame',
                    roomId: 'game-123'
                },
                'game-error'
            );

            expect(mockIo.to).toHaveBeenCalledWith('game-123');
            expect(mockRoom.emit).toHaveBeenCalledWith('game-error', {
                message: 'Game not found',
                code: 'NOT_FOUND'
            });
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit error directly to socket when roomId is not provided', () => {
            const error = new BadRequestError('Invalid request');

            handleSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'testOp',
                    userId: 'user-123'
                },
                'test-error'
            );

            expect(mockIo.to).not.toHaveBeenCalled();
            expect(mockSocket.emit).toHaveBeenCalledWith('test-error', {
                message: 'Invalid request',
                code: 'BAD_REQUEST'
            });
        });

        it('should use correct event name', () => {
            const error = new ConflictError('Conflict');

            handleSocketError(
                mockIo,
                mockSocket,
                error,
                {
                    operation: 'chatOp',
                    roomId: 'chat-123'
                },
                'chat-error'
            );

            expect(mockRoom.emit).toHaveBeenCalledWith('chat-error', expect.any(Object));
        });
    });
});
