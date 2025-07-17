export type CreateGameRequest = {
    players: string[];
};

export type CreateGameResponse = {
    players: { [key: string]: string };
    gameId: string;
};

export enum Color {
    WHITE = 'w',
    BLACK = 'b'
}
