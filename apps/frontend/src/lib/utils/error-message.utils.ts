import { SocketErrorCode } from '../models/errors/socket-error';

type ErrorContext = 'game' | 'chat' | 'general';

const gameErrorMessages: Record<SocketErrorCode, string> = {
    BAD_REQUEST: 'Invalid move. Please try again.',
    UNAUTHORIZED: 'You need to be authenticated to play.',
    FORBIDDEN: 'You cannot perform this action right now.',
    NOT_FOUND: 'Game session not found.',
    CONFLICT: 'This action conflicts with the current game state.',
    UNPROCESSABLE_ENTITY: 'Unable to process your move.',
    INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again.',
    INVALID_MOVE: 'Invalid move.',
    NOT_PLAYERS_TURN: "It's not your turn to move."
};

const chatErrorMessages: Record<SocketErrorCode, string> = {
    BAD_REQUEST: 'Invalid message. Please try again.',
    UNAUTHORIZED: 'You need to be authenticated to chat.',
    FORBIDDEN: 'You cannot send messages in this chat.',
    NOT_FOUND: 'Chat room not found.',
    CONFLICT: 'Message could not be sent due to a conflict.',
    UNPROCESSABLE_ENTITY: 'Unable to process your message.',
    INTERNAL_SERVER_ERROR: 'Failed to send message. Please try again.',
    INVALID_MOVE: 'Invalid action.',
    NOT_PLAYERS_TURN: 'Invalid action.'
};

const generalErrorMessages: Record<SocketErrorCode, string> = {
    BAD_REQUEST: 'Invalid request. Please try again.',
    UNAUTHORIZED: 'Authentication required.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'Resource not found.',
    CONFLICT: 'A conflict occurred. Please try again.',
    UNPROCESSABLE_ENTITY: 'Unable to process your request.',
    INTERNAL_SERVER_ERROR: 'An error occurred. Please try again.',
    INVALID_MOVE: 'Invalid move.',
    NOT_PLAYERS_TURN: "Not player's turn."
};

export function getUserFriendlyErrorMessage(
    backendMessage: string,
    code?: SocketErrorCode,
    context: ErrorContext = 'general'
): string {
    if (!code) {
        return backendMessage || 'An unexpected error occurred';
    }

    switch (context) {
        case 'game':
            return gameErrorMessages[code] || backendMessage;
        case 'chat':
            return chatErrorMessages[code] || backendMessage;
        case 'general':
        default:
            return generalErrorMessages[code] || backendMessage;
    }
}
