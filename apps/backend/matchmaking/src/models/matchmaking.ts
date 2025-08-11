import { Player } from './game';

export interface JoinQueueRequest {
    userId: string;
    elo: number;
}

export type LeaveQueueParams = {
    userId: string;
};

export type IsInQueueParams = {
    userId: string;
};

export type MatchmakeMessage = {
    players: Array<Player>;
    gameId: string;
};

export enum Color {
    BLACK = 'b',
    WHITE = 'w'
}
