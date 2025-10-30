import { RatingChange, Winner } from './game';
import { PlayerTimes } from './player';

export type TimeExpiredNotification = {
    winner: Winner;
    ratingChange: RatingChange;
};

export type PositionUpdateNotification = {
    position: string;
    isGameOver: boolean;
    winner: Winner | null;
    playerTimes: PlayerTimes;
    ratingChange: RatingChange | null;
};
