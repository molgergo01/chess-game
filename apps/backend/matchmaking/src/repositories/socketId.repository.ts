import { injectable } from 'inversify';
import redis from 'chess-game-backend-common/config/redis';
import { getRedisConnection } from 'chess-game-backend-common/transaction/redis-helper';

@injectable()
class SocketIdRepository {
    async setSocketIdForUser(userId: string, socketId: string) {
        const connection = getRedisConnection(redis);
        return connection.set(`${userId}:socketId`, socketId);
    }
    async getSocketIdForUser(userId: string): Promise<string | null> {
        return redis.get(`${userId}:socketId`);
    }
}

export default SocketIdRepository;
