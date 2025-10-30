import { injectable } from 'inversify';
import redis from 'chess-game-backend-common/config/redis';

@injectable()
class SocketIdRepository {
    setSocketIdForUser(userId: string, socketId: string) {
        redis.set(`${userId}:socketId`, socketId);
    }
    async getSocketIdForUser(userId: string): Promise<string | null> {
        return redis.get(`${userId}:socketId`);
    }
}

export default SocketIdRepository;
