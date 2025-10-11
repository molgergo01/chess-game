import { Player } from './player';
import { Color, Winner } from './game';

export type CreateGameResponse = {
    players: Array<Player>;
    gameId: string;
};

export type GetGameHistoryResponse = {
    games: Array<GameDto>;
    totalCount: number;
};

export type GetGameResponse = GameDto & {
    moves: Array<MoveDto>;
};

export type GameDto = {
    gameId: string;
    whitePlayer: UserDto;
    blackPlayer: UserDto;
    startedAt: Date;
    endedAt: Date;
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
};
