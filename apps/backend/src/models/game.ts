export interface MoveData {
    from: string;
    to: string;
    gameId: string;
}

export interface MoveCallback {
    (response: {
        success: boolean;
        position: string;
        gameOver: boolean;
        winner: Winner | null;
    }): void;
}

export interface PositionData {
    gameId: string;
}

export interface PositionCallback {
    (response: { position: string }): void;
}

export enum Winner {
    DRAW = 'd',
    BLACK = 'b',
    WHITE = 'w'
}
