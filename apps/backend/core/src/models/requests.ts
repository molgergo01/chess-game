export type PaginationQueryParams = {
    limit: number | undefined;
    offset: number | undefined;
};

export type InternalGetActiveGameQueryParams = {
    userId: string;
};

export type CreateGameRequest = {
    players: string[];
};

export type MoveRequest = {
    gameId: string;
    from: string;
    to: string;
    promotionPiece: string | undefined;
};

export type JoinGameRequest = {
    gameId: string;
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

export type JoinChatRoomRequest = {
    chatId: string;
};

export type LeaveChatRoomRequest = {
    chatId: string;
};

export type GetGameParams = {
    gameId: string;
};

export type GetChatMessagesParams = {
    chatId: string;
};
