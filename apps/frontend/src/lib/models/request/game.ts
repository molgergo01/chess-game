export interface MoveRequest {
    from: string;
    to: string;
    gameId: string;
    promotionPiece: string | undefined;
}

export interface PositionRequest {
    gameId: string;
}
