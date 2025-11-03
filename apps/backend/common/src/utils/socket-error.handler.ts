import { Server, Socket } from 'socket.io';
import BadRequestError from '../errors/bad.request.error';
import UnauthorizedError from '../errors/unauthorized.error';
import ForbiddenError from '../errors/forbidden.error';
import NotFoundError from '../errors/not.found.error';
import ConflictError from '../errors/conflict.error';
import UnprocessableEntityError from '../errors/unprocessable.entity.error';
import InternalServerError from '../errors/internal.server.error';

export interface SocketErrorContext {
    operation: string;
    userId?: string;
    roomId?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface SocketErrorPayload {
    message: string;
    code?: string;
}

function getErrorCode(error: Error): string | undefined {
    if (error instanceof BadRequestError) return 'BAD_REQUEST';
    if (error instanceof UnauthorizedError) return 'UNAUTHORIZED';
    if (error instanceof ForbiddenError) return 'FORBIDDEN';
    if (error instanceof NotFoundError) return 'NOT_FOUND';
    if (error instanceof ConflictError) return 'CONFLICT';
    if (error instanceof UnprocessableEntityError) return 'UNPROCESSABLE_ENTITY';
    if (error instanceof InternalServerError) return 'INTERNAL_SERVER_ERROR';
    return undefined;
}

function getUserFriendlyMessage(error: Error): string {
    if (error instanceof BadRequestError) return error.message;
    if (error instanceof UnauthorizedError) return error.message;
    if (error instanceof ForbiddenError) return error.message;
    if (error instanceof NotFoundError) return error.message;
    if (error instanceof ConflictError) return error.message;
    if (error instanceof UnprocessableEntityError) return error.message;
    if (error instanceof InternalServerError) return 'An internal server error occurred';
    return 'An unexpected error occurred';
}

export function handleSocketError(
    io: Server,
    socket: Socket,
    error: Error,
    context: SocketErrorContext,
    eventName: string
): void {
    const { operation, userId, roomId, ...additionalContext } = context;

    const contextParts: string[] = [];
    if (operation) contextParts.push(`operation=${operation}`);
    if (userId) contextParts.push(`userId=${userId}`);
    if (roomId) contextParts.push(`roomId=${roomId}`);

    const additionalContextStr = Object.entries(additionalContext)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');

    const fullContext = [...contextParts, additionalContextStr].filter(Boolean).join(', ');

    console.error(`[${operation}] Socket error${fullContext ? ` (${fullContext})` : ''}: ${error.message}`);

    const errorPayload: SocketErrorPayload = {
        message: getUserFriendlyMessage(error),
        code: getErrorCode(error)
    };

    if (roomId) {
        io.to(roomId).emit(eventName, errorPayload);
    } else {
        socket.emit(eventName, errorPayload);
    }
}
