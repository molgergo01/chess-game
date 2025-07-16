export interface MoveRequest {
    from: string;
    to: string;
    gameId: string;
    promotionPiece: string | undefined;
}

export interface MoveCallback {
    (response: {
        success: boolean;
        position: string;
        gameOver: boolean;
        winner: Winner | null;
    }): void;
}

export interface PositionRequest {
    gameId: string;
}

export interface PositionCallback {
    (response: {
        position: string;
        gameOver: boolean;
        winner: Winner | null;
    }): void;
}

export enum Winner {
    DRAW = 'd',
    BLACK = 'b',
    WHITE = 'w'
}
