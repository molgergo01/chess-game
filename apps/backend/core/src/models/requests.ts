export type CreateGameRequest = {
    players: string[];
};

export interface PositionRequest {
    gameId: string;
}

export interface MoveRequest {
    gameId: string;
    from: string;
    to: string;
    promotionPiece: string | undefined;
}

export type GetTimesRequest = {
    gameId: string;
};

export interface JoinGameRequest {
    gameId: string;
}

export type GetGameParams = {
    gameId: string;
};
