import { Color, Winner } from './game';

export type GameEntity = {
    id: string;
    white_player_id: string;
    black_player_id: string;
    started_at: Date;
    ended_at: Date | null;
    winner: Winner | null;
};

export type MoveEntity = {
    id: string;
    game_id: string;
    move_number: number;
    player_color: Color;
    move_notation: string;
    position_fen: string;
    white_player_time: number;
    black_player_time: number;
    created_at: Date;
};

export type UserEntity = {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    elo: number;
};
