import { injectable } from 'inversify';
import redis from 'chess-game-backend-common/config/redis';
import { ChatMessage } from '../models/chat';
import { getRedisConnection } from 'chess-game-backend-common/transaction/redis-helper';

@injectable()
class MessageRepository {
    async saveMessage(messageId: string, message: string, userId: string, timestamp: Date) {
        const connection = getRedisConnection(redis);
        const messageKey = this.getMessageKey(messageId);

        return connection.hSet(messageKey, {
            userId: userId,
            message: message,
            timestamp: JSON.stringify(timestamp)
        });
    }

    async getMessageBatch(messageIds: string[]): Promise<ChatMessage[]> {
        const multi = redis.multi();

        messageIds.forEach((messageId) => {
            const messageKey = this.getMessageKey(messageId);
            multi.hGetAll(messageKey);
        });

        const results = await multi.exec();

        const messages: ChatMessage[] = [];

        results?.forEach((result, index) => {
            const data = (Array.isArray(result) ? result[1] : result) as Record<string, string>;
            if (data && Object.keys(data).length > 0) {
                messages.push({
                    messageId: messageIds[index],
                    userId: data.userId,
                    message: data.message,
                    timestamp: new Date(data.timestamp)
                });
            }
        });

        return messages;
    }

    async removeMessages(messageIds: string[]) {
        const connection = getRedisConnection(redis);

        messageIds.forEach((messageId) => {
            const messageKey = this.getMessageKey(messageId);
            connection.del(messageKey);
        });
    }

    private getMessageKey(messageId: string) {
        return `message:${messageId}`;
    }
}

export default MessageRepository;
