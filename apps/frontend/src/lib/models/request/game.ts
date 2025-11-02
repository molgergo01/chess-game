import { Color } from '@/lib/models/response/game';

export type JoinGameRequest = {
    gameId: string;
};

export type GameUpdateMessage = {
    position: string;
    isGameOver: boolean;
    winner: Winner | null;
    playerTimes: PlayerTimes;
    ratingChange: RatingChange | null;
};

export type TimeExpiredMessage = {
    winner: Winner;
    ratingChange: RatingChange;
};

export type DrawOfferedMessage = {
    offeredBy: Color;
    expiresAt: Date;
};

export type MoveRequest = {
    gameId: string;
    from: string;
    to: string;
    promotionPiece: string | undefined;
};

export type PlayerTimes = {
    whiteTimeRemaining: number;
    blackTimeRemaining: number;
};

export type GetGameHistoryParams = {
    limit: number | null;
    offset: number | null;
};

export type GetLeaderboardParams = {
    limit: number | null;
    offset: number | null;
};

export type RatingChange = {
    whiteRatingChange: number;
    whiteNewRating: number;
    blackRatingChange: number;
    blackNewRating: number;
};

export type DrawOffer = {
    offeredBy: Color;
    expiresAt: Date;
};

export type ResignRequest = {
    gameId: string;
};

export type OfferDrawRequest = {
    gameId: string;
};

export type RespondDrawOfferRequest = {
    gameId: string;
    accepted: boolean;
};

export type SendChatMessageRequest = {
    chatId: string;
    message: string;
};

export enum Winner {
    DRAW = 'd',
    BLACK = 'b',
    WHITE = 'w'
}
