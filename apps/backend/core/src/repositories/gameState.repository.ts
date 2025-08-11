import redis from 'chess-game-backend-common/src/config/redis';
import { injectable } from 'inversify';
import { StoredGameState } from '../models/game';
import { Player, StoredPlayer } from '../models/player';

@injectable()
class GameStateRepository {
    save(
        gameId: string,
        fen: string,
        players: Array<Player>,
        lastMoveEpoch: number,
        startedAt: number
    ) {
        redis.hSet(`game-state:${gameId}`, {
            players: JSON.stringify(players),
            position: fen,
            lastMoveEpoch: lastMoveEpoch,
            startedAt: startedAt
        });
    }

    async get(gameId: string): Promise<StoredGameState | null> {
        const data = await redis.hGetAll(`game-state:${gameId}`);
        if (!data) {
            return null;
        }
        try {
            return {
                players: new Array<StoredPlayer>(JSON.parse(data.players)).flat(
                    1
                ),
                position: data.position,
                lastMoveEpoch: JSON.parse(data.lastMoveEpoch),
                startedAt: JSON.parse(data.startedAt)
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async keys(): Promise<string[]> {
        return redis.keys('game-state:*');
    }

    async removeGameState(gameId: string): Promise<void> {
        await redis.del(`game-state:${gameId}`);
    }
}

export default GameStateRepository;
