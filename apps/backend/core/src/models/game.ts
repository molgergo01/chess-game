import { Chess } from 'chess.js';

export interface JoinGameRequest {
    gameId: string;
}

export type GetGameIdCallback = {
    (response: { gameId: string | null }): void;
};

export interface UpdatePositionRequest {
    position: string;
    isGameOver: boolean;
    winner: Winner | null;
}

export type GameCreated = {
    gameId: string;
    players: Map<string, Color>;
};

export interface MoveRequest {
    gameId: string;
    from: string;
    to: string;
    promotionPiece: string | undefined;
}

export interface MoveCallback {
    (response: { success: boolean; position: string }): void;
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

export type CreateGameRequest = {
    players: string[];
};

export type CreateGameResponse = {
    players: { [key: string]: string };
    gameId: string;
};

export type StoredGameState = {
    players: Map<string, Color>;
    position: string;
};

export type GameState = {
    game: Chess;
    players: Map<string, Color>;
};

export enum Color {
    BLACK = 'b',
    WHITE = 'w'
}
export enum Winner {
    DRAW = 'd',
    BLACK = 'b',
    WHITE = 'w'
}
