import redis from 'chess-game-backend-common/src/config/redis';
import { injectable } from 'inversify';
import { Color, StoredGameState } from '../models/game';

@injectable()
class GameStateRepository {
    save(gameId: string, fen: string, players: Map<string, Color>) {
        const playersObject = Object.fromEntries(players);
        redis.hSet(`game-state:${gameId}`, {
            players: JSON.stringify(playersObject),
            position: fen
        });
    }

    savePosition(gameId: string, fen: string) {
        redis.hSet(`game-state:${gameId}`, 'position', fen);
    }

    async get(gameId: string): Promise<StoredGameState | null> {
        const data = await redis.hGetAll(`game-state:${gameId}`);
        if (!data) {
            return null;
        }
        try {
            return {
                players: new Map<string, Color>(
                    Object.entries(JSON.parse(data.players))
                ),
                position: data.position
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async getPlayers(gameId: string) {
        const data = await redis.hGet(`game-state:${gameId}`, 'players');
        if (!data) {
            return null;
        }

        return new Map<string, Color>(Object.entries(JSON.parse(data)));
    }

    async getPosition(gameId: string): Promise<string | null> {
        return redis.hGet(`game-state:${gameId}`, 'position');
    }

    async removeGameState(gameId: string): Promise<void> {
        await redis.del(`game-state:${gameId}`);
    }
}

export default GameStateRepository;
