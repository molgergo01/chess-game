import { Color, RatingChange, Winner } from './game';
import { PlayerTimes } from './player';
import { ChatMessage } from './chat';

export type GameOverNotification = {
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

export type DrawOfferedNotification = {
    offeredBy: Color;
    expiresAt: Date;
};

export type ChatMessagesUpdatedNotification = {
    chatMessages: ChatMessage[];
};
