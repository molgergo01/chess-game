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

export type GetGameHistoryParams = {
    userId: string;
    limit: number | null;
    offset: number | null;
};

export enum Winner {
    DRAW = 'd',
    BLACK = 'b',
    WHITE = 'w'
}
