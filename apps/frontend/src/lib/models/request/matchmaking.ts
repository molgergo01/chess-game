export type JoinQueueRequest = {
    userId: string;
};

export type MatchmakeMessage = {
    players: Array<Player>;
    gameId: string;
};

export type Player = {
    id: string;
    color: string;
    timer: {
        remainingMs: number;
    };
};

export enum Color {
    BLACK = 'black',
    WHITE = 'white'
}
