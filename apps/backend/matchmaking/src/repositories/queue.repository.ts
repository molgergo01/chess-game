import { injectable } from 'inversify';
import redis from 'chess-game-backend-common/config/redis';

@injectable()
class QueueRepository {
    pushToQueueEnd(userId: string, queueId: string | null) {
        const queueKey = this.getQueueKey(queueId);
        redis.lPush(queueKey, userId);
    }

    pushToQueueFront(userId: string, queueId: string | null) {
        const queueKey = this.getQueueKey(queueId);
        redis.rPush(queueKey, userId);
    }

    removeFromQueue(userId: string, queueId: string | null) {
        const queueKey = this.getQueueKey(queueId);
        redis.lRem(queueKey, 1, userId);
    }

    async getQueueCount(queueId: string | null): Promise<number> {
        const queueKey = this.getQueueKey(queueId);
        return redis.lLen(queueKey);
    }

    async popQueue(queueId: string | null) {
        const queueKey = this.getQueueKey(queueId);
        return redis.rPopCount(queueKey, 2);
    }

    // TODO Improvement: Store each player's queueId as redis hash for performance.
    async getQueueId(userId: string) {
        let cursor = '0';
        do {
            const result = await redis.scan(cursor, {
                MATCH: 'matchmaking-queue*',
                COUNT: 100
            });
            cursor = result.cursor;

            for (const key of result.keys) {
                const position = await redis.lPos(key, userId);
                if (position !== null) {
                    return key == 'matchmaking-queue' ? '' : key.split(':')[1];
                }
            }
        } while (cursor !== '0');

        return null;
    }

    private getQueueKey(queueId: string | null) {
        return queueId ? 'matchmaking-queue:' + queueId : 'matchmaking-queue';
    }
}

export default QueueRepository;
