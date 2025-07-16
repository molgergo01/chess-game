export interface PositionResponse {
    position: string;
    gameOver: boolean;
    winner: Winner | null;
}

export interface MoveResponse {
    success: boolean;
    position: string;
    gameOver: boolean;
    winner: Winner | null;
}

export enum Winner {
    DRAW = 'd',
    BLACK = 'b',
    WHITE = 'w'
}
