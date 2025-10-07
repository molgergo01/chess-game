import { Chess } from 'chess.js';
import { Player, StoredPlayer } from './player';

export interface JoinGameRequest {
    gameId: string;
}

export type GetGameIdCallback = {
    (response: { gameId: string | null }): void;
};

export type GetTimesRequest = {
    gameId: string;
};

export type GetTimesCallback = {
    (response: { playerTimes: PlayerTimes }): void;
};

export type PlayerTimes = {
    blackTimeRemaining: number;
    whiteTimeRemaining: number;
};

export interface PositionUpdateNotification {
    position: string;
    isGameOver: boolean;
    winner: Winner | null;
    playerTimes: PlayerTimes;
}

export type GameCreated = {
    gameId: string;
    players: Array<Player>;
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
    (response: { position: string; gameOver: boolean; winner: Winner | null }): void;
}

export type CreateGameRequest = {
    players: string[];
};

export type CreateGameResponse = {
    players: Array<Player>;
    gameId: string;
};

export type StoredGameState = {
    players: Array<StoredPlayer>;
    position: string;
    lastMoveEpoch: number;
    startedAt: number;
};

export type GameState = {
    game: Chess;
    players: Array<Player>;
    lastMoveEpoch: number;
    startedAt: number;
};

export type TimeExpiredMessage = {
    winner: Winner;
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
