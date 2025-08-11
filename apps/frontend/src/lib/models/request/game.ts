import { Winner } from '@/lib/models/response/game';

export interface JoinGameRequest {
    gameId: string;
}

export type GetTimesRequest = {
    gameId: string;
};

export interface GameUpdateMessage {
    position: string;
    isGameOver: boolean;
    winner: Winner | null;
    playerTimes: PlayerTimes;
}

export interface TimeExpiredMessage {
    winner: Winner;
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

export type PlayerTimes = {
    whiteTimeRemaining: number;
    blackTimeRemaining: number;
};
