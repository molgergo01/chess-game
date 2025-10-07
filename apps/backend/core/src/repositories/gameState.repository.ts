import { inject, injectable } from 'inversify';
import { StoredGameState } from '../models/game';
import { Player, StoredPlayer } from '../models/player';
import Redis from 'chess-game-backend-common/config/redis';

@injectable()
class GameStateRepository {
    constructor(
        @inject('Redis')
        private readonly redis: typeof Redis
    ) {}

    save(gameId: string, fen: string, players: Array<Player>, lastMoveEpoch: number, startedAt: number) {
        this.redis.hSet(`game-state:${gameId}`, {
            players: JSON.stringify(players),
            position: fen,
            lastMoveEpoch: lastMoveEpoch,
            startedAt: startedAt
        });
    }

    async get(gameId: string): Promise<StoredGameState | null> {
        const data = await this.redis.hGetAll(`game-state:${gameId}`);
        if (!data) {
            return null;
        }
        try {
            return {
                players: new Array<StoredPlayer>(JSON.parse(data.players)).flat(1),
                position: data.position,
                lastMoveEpoch: JSON.parse(data.lastMoveEpoch),
                startedAt: JSON.parse(data.startedAt)
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async getKeys(): Promise<string[]> {
        return this.redis.keys('game-state:*');
    }

    async remove(gameId: string): Promise<void> {
        await this.redis.del(`game-state:${gameId}`);
    }
}

export default GameStateRepository;
