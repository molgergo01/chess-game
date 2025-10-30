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

export type GetGameHistoryResponse = {
    games: Array<GameDto>;
    totalCount: number;
};

export type GetGameResponse = GameDto & {
    moves: Array<MoveDto>;
};

export type GetLeaderboardResponse = {
    users: Array<LeaderboardUserDto>;
    totalCount: number;
};

export type GameDto = {
    gameId: string;
    whitePlayer: UserDto;
    blackPlayer: UserDto;
    startedAt: Date;
    winner: Winner;
};

export type MoveDto = {
    moveNumber: number;
    playerColor: Color;
    moveNotation: string;
    positionFen: string;
    whitePlayerTime: number;
    blackPlayerTime: number;
};

export type UserDto = {
    userId: string;
    name: string;
    elo: number;
    avatarUrl: string | null;
};

export type LeaderboardUserDto = {
    userId: string;
    rank: number;
    name: string;
    elo: number;
    avatarUrl: string | null;
};

export type GetActiveGameResponse = {
    gameId: string;
    whitePlayer: UserDto;
    blackPlayer: UserDto;
    position: string;
    whiteTimeRemaining: number;
    blackTimeRemaining: number;
    gameOver: boolean;
    winner: Winner | null;
};

export type PlayerTimes = {
    whiteTimeRemaining: number;
    blackTimeRemaining: number;
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
