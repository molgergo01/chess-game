import { Color } from './game';
import { Timer } from './timer';

export type Player = {
    id: string;
    color: Color;
    timer: Timer;
};

export type StoredPlayer = {
    id: string;
    color: Color;
    timer: {
        remainingMs: number;
    };
};
