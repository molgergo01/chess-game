import { Server, Socket } from 'socket.io';
import {
    handleSocketError,
    SocketErrorContext,
    SocketErrorPayload
} from 'chess-game-backend-common/utils/socket-error.handler';
import InvalidMoveError from '../errors/invalid.move.error';
import NotPlayersTurnError from '../errors/not.players.turn.error';

function getCoreErrorCode(error: Error): string | undefined {
    if (error instanceof InvalidMoveError) return 'INVALID_MOVE';
    if (error instanceof NotPlayersTurnError) return 'NOT_PLAYERS_TURN';
    return undefined;
}

function getCoreUserFriendlyMessage(error: Error): string | undefined {
    if (error instanceof InvalidMoveError) return error.message;
    if (error instanceof NotPlayersTurnError) return error.message;
    return undefined;
}

export function handleCoreSocketError(
    io: Server,
    socket: Socket,
    error: Error,
    context: SocketErrorContext,
    eventName: string
): void {
    const coreErrorCode = getCoreErrorCode(error);
    const coreMessage = getCoreUserFriendlyMessage(error);

    if (coreErrorCode && coreMessage) {
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
            message: coreMessage,
            code: coreErrorCode
        };

        if (roomId) {
            io.to(roomId).emit(eventName, errorPayload);
        } else {
            socket.emit(eventName, errorPayload);
        }
    } else {
        handleSocketError(io, socket, error, context, eventName);
    }
}
