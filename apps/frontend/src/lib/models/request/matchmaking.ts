export type JoinQueueRequest = {
    userId: string;
};

export type MatchmakeMessage = {
    players: { [key: string]: string };
    gameId: string;
};

export enum Color {
    BLACK = 'black',
    WHITE = 'white'
}
