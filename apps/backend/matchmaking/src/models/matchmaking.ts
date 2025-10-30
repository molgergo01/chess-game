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

export type GetQueueStatusResponse = {
    isQueued: boolean;
    queueId: string | null;
    hasActiveGame: boolean;
};

export type QueuedPlayer = {
    playerId: string;
    queueTimestamp: number;
    elo: number;
    queueId: string;
};

export type EloRange = {
    minElo: number;
    maxElo: number;
};
