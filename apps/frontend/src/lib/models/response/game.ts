export type GetGameIdResponse = {
    gameId: string | null;
};

export interface PositionResponse {
    position: string;
    gameOver: boolean;
    winner: Winner | null;
}

export interface MoveResponse {
    success: boolean;
    position: string;
}

export enum Winner {
    DRAW = 'd',
    BLACK = 'b',
    WHITE = 'w'
}
