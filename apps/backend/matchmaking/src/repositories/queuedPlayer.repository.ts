import { injectable } from 'inversify';
import redis from 'chess-game-backend-common/config/redis';
import { QueuedPlayer } from '../models/matchmaking';

@injectable()
class QueuedPlayerRepository {
    async save(userId: string, queueTimestamp: number, elo: number, queueId: string | null) {
        const setId = this.getSetKey(userId);
        return redis.hSet(setId, {
            queueTimestamp: queueTimestamp,
            elo: elo,
            queueId: queueId ? queueId : ''
        });
    }

    async delete(userId: string) {
        const setId = this.getSetKey(userId);
        return redis.del(setId);
    }

    async get(userId: string): Promise<QueuedPlayer | null> {
        const setId = this.getSetKey(userId);
        const data = await redis.hGetAll(setId);
        if (!data) {
            return null;
        }

        return {
            playerId: userId,
            elo: Number(data.elo),
            queueTimestamp: Number(data.queueTimestamp),
            queueId: data.queueId
        };
    }

    async getBatch(userIds: string[]): Promise<QueuedPlayer[]> {
        const multi = redis.multi();

        userIds.forEach((userId) => {
            const setKey = this.getSetKey(userId);
            multi.hGetAll(setKey);
        });

        const results = await multi.exec();

        const players: QueuedPlayer[] = [];

        results?.forEach((result, index) => {
            const data = (Array.isArray(result) ? result[1] : result) as Record<string, string>;
            if (data && Object.keys(data).length > 0) {
                players.push({
                    playerId: userIds[index],
                    elo: Number(data.elo),
                    queueTimestamp: Number(data.queueTimestamp),
                    queueId: data.queueId
                });
            }
        });

        return players;
    }

    async getQueueId(userId: string): Promise<string | null> {
        const setId = this.getSetKey(userId);
        return redis.hGet(setId, 'queueId');
    }

    private getSetKey(userId: string) {
        return `player:${userId}`;
    }
}

export default QueuedPlayerRepository;
