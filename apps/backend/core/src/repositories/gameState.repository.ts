import { inject, injectable } from 'inversify';
import { DrawOffer, StoredGameState } from '../models/game';
import { Player, StoredPlayer } from '../models/player';
import Redis from 'chess-game-backend-common/config/redis';
import { getRedisConnection } from 'chess-game-backend-common/transaction/redis-helper';

@injectable()
class GameStateRepository {
    constructor(
        @inject('Redis')
        private readonly redis: typeof Redis
    ) {}

    async save(
        gameId: string,
        fen: string,
        players: Array<Player>,
        lastMoveEpoch: number,
        startedAt: number,
        drawOffer: DrawOffer | undefined
    ): Promise<void> {
        const connection = getRedisConnection(this.redis);
        const data: Record<string, string> = {
            players: JSON.stringify(players),
            position: fen,
            lastMoveEpoch: lastMoveEpoch.toString(),
            startedAt: startedAt.toString()
        };

        if (drawOffer) {
            data.drawOffer = JSON.stringify(drawOffer);
        } else {
            await connection.hDel(`game-state:${gameId}`, 'drawOffer');
        }

        await connection.hSet(`game-state:${gameId}`, data);
    }

    async get(gameId: string): Promise<StoredGameState | null> {
        const data = await this.redis.hGetAll(`game-state:${gameId}`);
        if (!data) {
            return null;
        }
        try {
            const parsedData = {
                players: new Array<StoredPlayer>(JSON.parse(data.players)).flat(1),
                position: data.position,
                lastMoveEpoch: JSON.parse(data.lastMoveEpoch),
                startedAt: JSON.parse(data.startedAt),
                drawOffer: data.drawOffer ? JSON.parse(data.drawOffer) : undefined
            };
            if (parsedData.drawOffer) {
                parsedData.drawOffer.expiresAt = new Date(parsedData.drawOffer.expiresAt);
            }
            return parsedData;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async getKeys(): Promise<string[]> {
        return this.redis.keys('game-state:*');
    }

    async remove(gameId: string): Promise<void> {
        const connection = getRedisConnection(this.redis);
        await connection.del(`game-state:${gameId}`);
    }
}

export default GameStateRepository;
