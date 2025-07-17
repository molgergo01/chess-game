import { Winner } from '@/lib/models/response/game';

export interface JoinGameRequest {
    gameId: string;
}

export interface UpdatePositionRequest {
    position: string;
    isGameOver: boolean;
    winner: Winner | null;
}

export interface MoveRequest {
    gameId: string;
    from: string;
    to: string;
    promotionPiece: string | undefined;
}

export interface PositionRequest {
    gameId: string;
}

export interface ResetRequest {
    gameId: string;
}
