import { injectable } from 'inversify';
import redis from 'chess-game-backend-common/config/redis';

@injectable()
export class SocketIdRepository {
    setSocketIdForUser(userId: string, socketId: string) {
        redis.set(`${userId}.socketId`, socketId);
    }
    async getSocketIdForUser(userId: string) {
        return redis.get(`${userId}.socketId`);
    }
}
