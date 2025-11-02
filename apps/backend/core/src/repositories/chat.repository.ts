import { injectable } from 'inversify';
import redis from 'chess-game-backend-common/config/redis';

@injectable()
class ChatRepository {
    async addParticipant(chatId: string, userId: string) {
        const chatParticipantKey = this.getChatParticipantKey(chatId);

        return redis.sAdd(chatParticipantKey, userId);
    }

    async removeParticipant(chatId: string, userId: string) {
        const chatParticipantKey = this.getChatParticipantKey(chatId);

        return redis.sRem(chatParticipantKey, userId);
    }

    async isParticipant(chatId: string, userId: string): Promise<boolean> {
        const chatParticipantKey = this.getChatParticipantKey(chatId);

        return (await redis.sIsMember(chatParticipantKey, userId)) === 1;
    }

    async addChatMessageId(chatId: string, messageId: string, timestamp: Date) {
        const chatKey = this.getChatKey(chatId);

        return redis.zAdd(chatKey, { value: messageId, score: timestamp.getTime() });
    }

    async removeChat(chatId: string) {
        const chatParticipantKey = this.getChatParticipantKey(chatId);
        const chatKey = this.getChatKey(chatId);

        const multi = redis.multi();

        multi.del(chatKey);
        multi.del(chatParticipantKey);

        return multi.exec();
    }

    async getChatMessageIds(chatId: string) {
        const chatKey = this.getChatKey(chatId);

        return redis.zRange(chatKey, 0, -1);
    }

    private getChatKey(chatId: string) {
        return `chat:${chatId}`;
    }

    private getChatParticipantKey(chatId: string) {
        return `chat:${chatId}:participants`;
    }
}

export default ChatRepository;
