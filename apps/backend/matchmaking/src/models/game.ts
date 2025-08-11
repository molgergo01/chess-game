export type CreateGameRequest = {
    players: string[];
};

export type CreateGameResponse = {
    players: Array<Player>;
    gameId: string;
};

export type Player = {
    id: string;
    color: Color;
    timer: {
        remainingMs: number;
    };
};

export enum Color {
    WHITE = 'w',
    BLACK = 'b'
}
