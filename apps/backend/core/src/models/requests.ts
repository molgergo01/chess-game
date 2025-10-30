export type CreateGameRequest = {
    players: string[];
};

export interface MoveRequest {
    gameId: string;
    from: string;
    to: string;
    promotionPiece: string | undefined;
}

export interface JoinGameRequest {
    gameId: string;
}

export type GetGameParams = {
    gameId: string;
};
