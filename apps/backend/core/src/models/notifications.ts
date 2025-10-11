import { Winner } from './game';
import { PlayerTimes } from './player';

export type TimeExpiredNotification = {
    winner: Winner;
};

export interface PositionUpdateNotification {
    position: string;
    isGameOver: boolean;
    winner: Winner | null;
    playerTimes: PlayerTimes;
}
