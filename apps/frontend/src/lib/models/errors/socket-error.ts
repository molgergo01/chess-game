export type SocketErrorCode =
    | 'BAD_REQUEST'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'UNPROCESSABLE_ENTITY'
    | 'INTERNAL_SERVER_ERROR'
    | 'INVALID_MOVE'
    | 'NOT_PLAYERS_TURN';

export interface SocketErrorPayload {
    message: string;
    code?: SocketErrorCode;
}

export type ErrorSeverity = 'toast' | 'alert';

export function getErrorSeverity(code?: SocketErrorCode): ErrorSeverity {
    if (!code) return 'toast';

    switch (code) {
        case 'UNAUTHORIZED':
        case 'NOT_FOUND':
        case 'INTERNAL_SERVER_ERROR':
            return 'alert';
        case 'BAD_REQUEST':
        case 'FORBIDDEN':
        case 'CONFLICT':
        case 'UNPROCESSABLE_ENTITY':
        case 'INVALID_MOVE':
        case 'NOT_PLAYERS_TURN':
        default:
            return 'toast';
    }
}
