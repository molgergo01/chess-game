import { inject, injectable } from 'inversify';
import ChatRepository from '../repositories/chat.repository';
import MessageRepository from '../repositories/message.repository';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../models/chat';
import ForbiddenError from 'chess-game-backend-common/errors/forbidden.error';

@injectable()
class ChatService {
    constructor(
        @inject(ChatRepository)
        private readonly chatRepository: ChatRepository,
        @inject(MessageRepository)
        private readonly messageRepository: MessageRepository
    ) {}

    async addParticipant(chatId: string, userId: string): Promise<void> {
        await this.chatRepository.addParticipant(chatId, userId);
    }

    async removeParticipant(chatId: string, userId: string): Promise<void> {
        await this.chatRepository.removeParticipant(chatId, userId);
    }

    async deleteChat(chatId: string): Promise<void> {
        const messageIds = await this.chatRepository.getChatMessageIds(chatId);

        await this.messageRepository.removeMessages(messageIds);
        await this.chatRepository.removeChat(chatId);
    }

    async createChatMessage(chatId: string, userId: string, message: string) {
        if (!(await this.chatRepository.isParticipant(chatId, userId))) {
            throw new ForbiddenError('User is not a member of the chat');
        }

        const timestamp = new Date();
        const messageId = uuidv4();

        await this.chatRepository.addChatMessageId(chatId, messageId, timestamp);
        await this.messageRepository.saveMessage(messageId, message, userId, timestamp);
    }

    async createSystemChatMessage(chatId: string, message: string) {
        const timestamp = new Date();
        const messageId = uuidv4();

        await this.chatRepository.addChatMessageId(chatId, messageId, timestamp);
        await this.messageRepository.saveMessage(messageId, message, 'SYSTEM', timestamp);
    }

    async getChatMessages(chatId: string, userId: string): Promise<ChatMessage[]> {
        if (!(await this.chatRepository.isParticipant(chatId, userId))) {
            throw new ForbiddenError('User is not a member of the chat');
        }

        const messageIds = await this.chatRepository.getChatMessageIds(chatId);
        return await this.messageRepository.getMessageBatch(messageIds);
    }
}

export default ChatService;
