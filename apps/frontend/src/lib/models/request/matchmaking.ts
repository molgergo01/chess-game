export type JoinQueueRequest = {
    userId: string;
};

export type CreateQueueRequest = {
    userId: string;
};

export type LeaveQueueRequest = {
    userId: string;
};

export type GetQueueStatusParams = {
    userId: string;
};

export type MatchmakeMessage = {
    gameId: string;
};

export enum MatchmakingColor {
    BLACK = 'black',
    WHITE = 'white'
}
