export type JoinPrivateQueueParams = {
    queueId: string;
};

export type JoinQueueRequest = {
    userId: string;
    elo: number;
};

export type JoinPrivateQueueRequest = {
    userId: string;
};

export type CreatePrivateQueueRequest = {
    userId: string;
};

export type CreatePrivateQueueResponse = {
    queueId: string;
};

export type LeavePrivateQueueParams = {
    queueId: string;
};

export type LeaveQueueRequest = {
    userId: string;
};

export type LeavePrivateQueueRequest = {
    userId: string;
};

export type MatchmakeMessage = {
    gameId: string;
};

export type GetQueueStatusResponse = {
    isQueued: boolean;
    queueId: string | null;
    hasActiveGame: boolean;
};

export enum Color {
    BLACK = 'b',
    WHITE = 'w'
}
