export type GetQueueStatusResponse = {
    isQueued: boolean;
    queueId: string | null;
    hasActiveGame: boolean;
};
