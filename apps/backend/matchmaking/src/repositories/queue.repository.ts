import { injectable } from 'inversify';
import redis from 'chess-game-backend-common/config/redis';

@injectable()
class QueueRepository {
    async pushToQueue(userId: string, queueId: string | null, score: number) {
        const queueKey = this.getQueueKey(queueId);
        return redis.zAdd(queueKey, { value: userId, score: score });
    }

    async removeFromQueue(userId: string, queueId: string | null) {
        const queueKey = this.getQueueKey(queueId);
        return redis.zRem(queueKey, userId);
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
