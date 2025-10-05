import { inject, injectable } from 'inversify';
import Redis from 'chess-game-backend-common/config/redis';

@injectable()
class GameIdRepository {
    constructor(
        @inject('Redis')
        private readonly redis: typeof Redis
    ) {}
    async save(userId: string, gameId: string) {
        this.redis.set(`game-id:${userId}`, gameId);
    }

    async get(userId: string): Promise<string | null> {
        return this.redis.get(`game-id:${userId}`);
    }

    async remove(gameId: string) {
        const pattern = 'game-id:*';
        const keys = await this.redis.keys(pattern);

        if (keys.length === 0) {
            return;
        }

        const keysToDelete: string[] = [];

        for (const key of keys) {
            const value = await this.redis.get(key);
            if (value === gameId) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach((key) => {
            this.redis.del(key);
        });
    }
}

export default GameIdRepository;
