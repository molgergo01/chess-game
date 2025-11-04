import { injectable } from 'inversify';
import redis from 'chess-game-backend-common/config/redis';
import { getRedisConnection } from 'chess-game-backend-common/transaction/redis-helper';

@injectable()
class QueueRepository {
    async pushToQueue(userId: string, queueId: string | null, score: number) {
        const connection = getRedisConnection(redis);
        const queueKey = this.getQueueKey(queueId);
        return connection.zAdd(queueKey, { value: userId, score: score });
    }

    async removeFromQueue(userId: string, queueId: string | null) {
        const connection = getRedisConnection(redis);
        const queueKey = this.getQueueKey(queueId);
        return connection.zRem(queueKey, userId);
    }

    async getQueueCount(queueId: string | null): Promise<number> {
        const queueKey = this.getQueueKey(queueId);
        return redis.zCard(queueKey);
    }

    async popQueue(queueId: string | null, count: number) {
        const queueKey = this.getQueueKey(queueId);
        return redis.zPopMinCount(queueKey, count);
    }

    private getQueueKey(queueId: string | null) {
        return queueId ? 'matchmaking-queue:' + queueId : 'matchmaking-queue';
    }
}

export default QueueRepository;
