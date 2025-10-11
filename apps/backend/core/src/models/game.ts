import { Chess } from 'chess.js';
import { Player, StoredPlayer } from './player';
import { Move } from './move';
import { User } from './user';

export type GameCreated = {
    gameId: string;
    players: Array<Player>;
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

export type Game = {
    id: string;
    whitePlayerId: string;
    blackPlayerId: string;
    startedAt: Date;
    endedAt: Date | null;
    winner: Winner | null;
};

export type GameWithPlayers = {
    id: string;
    whitePlayer: User;
    blackPlayer: User;
    startedAt: Date;
    endedAt: Date | null;
    winner: Winner | null;
};

export type GameWithMoves = GameWithPlayers & {
    moves: Move[];
};

export type GameHistoryResult = {
    games: Array<GameWithPlayers>;
    totalCount: number;
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
