import { injectable } from 'inversify';
import redis from 'chess-game-backend-common/config/redis';

@injectable()
class QueueRepository {
    pushToQueueEnd(userId: string) {
        redis.lPush('matchmaking-queue', userId);
    }

    pushToQueueFront(userId: string) {
        redis.rPush('matchmaking-queue', userId);
    }

    removeFromQueue(userId: string) {
        redis.lRem('matchmaking-queue', 1, userId);
    }

    async getQueueCount(): Promise<number> {
        return redis.lLen('matchmaking-queue');
    }

    async popQueue() {
        return redis.rPopCount('matchmaking-queue', 2);
    }

    async isInQueue(userId: string) {
        const position = await redis.lPos('matchmaking-queue', userId);
        return position !== null;
    }
}

export default QueueRepository;
