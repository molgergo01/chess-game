export type GameHistory = {
    games: Array<Game>;
    totalCount: number;
};

export type GameWithMoves = Game & {
    moves: Array<Move>;
};

export type Game = {
    gameId: string;
    whitePlayer: User;
    blackPlayer: User;
    startedAt: Date;
    winner: Winner;
};

export type Move = {
    moveNumber: number;
    playerColor: Color;
    moveNotation: string;
    positionFen: string;
    whitePlayerTime: number;
    blackPlayerTime: number;
};

export enum Winner {
    DRAW = 'd',
    BLACK = 'b',
    WHITE = 'w'
}

export enum Color {
    BLACK = 'b',
    WHITE = 'w'
}

type User = {
    userId: string;
    name: string;
    elo: number;
    avatarUrl: string | null;
};
