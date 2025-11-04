import { injectable } from 'inversify';
import redis from 'chess-game-backend-common/config/redis';
import { getRedisConnection } from 'chess-game-backend-common/transaction/redis-helper';

@injectable()
class ChatRepository {
    async addParticipant(chatId: string, userId: string) {
        const connection = getRedisConnection(redis);
        const chatParticipantKey = this.getChatParticipantKey(chatId);

        return connection.sAdd(chatParticipantKey, userId);
    }

    async removeParticipant(chatId: string, userId: string) {
        const connection = getRedisConnection(redis);
        const chatParticipantKey = this.getChatParticipantKey(chatId);

        return connection.sRem(chatParticipantKey, userId);
    }

    async isParticipant(chatId: string, userId: string): Promise<boolean> {
        const chatParticipantKey = this.getChatParticipantKey(chatId);

        return (await redis.sIsMember(chatParticipantKey, userId)) === 1;
    }

    async addChatMessageId(chatId: string, messageId: string, timestamp: Date) {
        const connection = getRedisConnection(redis);
        const chatKey = this.getChatKey(chatId);

        return connection.zAdd(chatKey, { value: messageId, score: timestamp.getTime() });
    }

    async removeChat(chatId: string) {
        const connection = getRedisConnection(redis);
        const chatParticipantKey = this.getChatParticipantKey(chatId);
        const chatKey = this.getChatKey(chatId);

        connection.del(chatKey);
        return connection.del(chatParticipantKey);
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
