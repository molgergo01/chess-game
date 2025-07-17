import redis from 'chess-game-backend-common/src/config/redis';
import { injectable } from 'inversify';

@injectable()
class GameIdRepository {
    async save(userId: string, gameId: string) {
        redis.set(`game-id:${userId}`, gameId);
    }

    async getGameId(userId: string): Promise<string | null> {
        return redis.get(`game-id:${userId}`);
    }

    async removeByGameId(gameId: string) {
        const pattern = 'game-id:*';
        const keys = await redis.keys(pattern);

        if (keys.length === 0) {
            return;
        }

        const keysToDelete: string[] = [];

        for (const key of keys) {
            const value = await redis.get(key);
            if (value === gameId) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach((key) => {
            redis.del(key);
        });
    }
}

export default GameIdRepository;
