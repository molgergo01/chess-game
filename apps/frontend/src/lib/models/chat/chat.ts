export type ChatMessage = {
    messageId: string;
    userId: string;
    message: string;
    timestamp: Date;
};

export type ChatMessagesUpdatedMessage = {
    chatMessages: ChatMessage[];
};

export type GetChatMessagesResponse = {
    messages: ChatMessage[];
};

export type JoinChatRequest = {
    chatId: string;
};

export type LeaveChatRequest = {
    chatId: string;
};
