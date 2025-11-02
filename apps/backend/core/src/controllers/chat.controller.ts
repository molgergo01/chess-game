import { inject, injectable } from 'inversify';
import ChatService from '../services/chat.service';
import { AuthenticatedRequest } from 'chess-game-backend-common/types/authenticated.request';
import { NextFunction, Response } from 'express';
import { GetChatMessagesParams } from '../models/requests';
import { GetChatMessagesResponse } from '../models/responses';

@injectable()
class ChatController {
    constructor(
        @inject(ChatService)
        private readonly chatService: ChatService
    ) {}

    async getChatMessages(
        req: AuthenticatedRequest<GetChatMessagesParams, unknown, unknown>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const messages = await this.chatService.getChatMessages(req.params.chatId, req.user.id);

            const response: GetChatMessagesResponse = {
                messages: messages
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }
}

export default ChatController;
