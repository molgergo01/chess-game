import { Color } from './game';

export type Move = {
    id: string;
    gameId: string;
    moveNumber: number;
    playerColor: Color;
    moveNotation: string;
    positionFen: string;
    whitePlayerTime: number;
    blackPlayerTime: number;
    createdAt: Date;
};
