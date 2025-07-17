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
    players: { [key: string]: string };
    gameId: string;
};

export enum Color {
    BLACK = 'b',
    WHITE = 'w'
}
