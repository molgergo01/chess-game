import Redis from 'chess-game-backend-common/config/redis';
import GameStateRepository from '../../src/repositories/gameState.repository';
import { Player } from '../../src/models/player';
import { Color } from '../../src/models/game';
import { Timer } from '../../src/models/timer';

jest.mock('chess-game-backend-common/config/redis', () => ({
    hSet: jest.fn(),
    hGetAll: jest.fn(),
    keys: jest.fn(),
    del: jest.fn()
}));

describe('GameState Repository', () => {
    let gameStateRepository: GameStateRepository;

    beforeEach(() => {
        gameStateRepository = new GameStateRepository(Redis);
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('save', () => {
        it('should call redis.hSet with correct key pattern and serialized data', async () => {
            const gameId = 'game123';
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const players: Array<Player> = [
                { id: 'user1', color: Color.WHITE, timer: new Timer(600000) },
                { id: 'user2', color: Color.BLACK, timer: new Timer(600000) }
            ];
            const lastMoveEpoch = 1234567890;
            const startedAt = 1234567800;

            const expectedKey = 'game-state:game123';
            const expectedData = {
                players: JSON.stringify(players),
                position: fen,
                lastMoveEpoch: lastMoveEpoch,
                startedAt: startedAt
            };

            gameStateRepository.save(gameId, fen, players, lastMoveEpoch, startedAt);

            expect(Redis.hSet).toHaveBeenCalledWith(expectedKey, expectedData);
        });
    });

    describe('get', () => {
        it('should call redis.hGetAll and return parsed game state', async () => {
            const gameId = 'game123';
            const expectedKey = 'game-state:game123';
            const mockData = {
                players: JSON.stringify([
                    {
                        id: 'user1',
                        color: Color.WHITE,
                        timer: { remainingMs: 600000 }
                    },
                    {
                        id: 'user2',
                        color: Color.BLACK,
                        timer: { remainingMs: 600000 }
                    }
                ]),
                position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                lastMoveEpoch: '1234567890',
                startedAt: '1234567800'
            };

            (Redis.hGetAll as jest.Mock).mockResolvedValue(mockData);

            const result = await gameStateRepository.get(gameId);

            expect(Redis.hGetAll).toHaveBeenCalledWith(expectedKey);
            expect(result).toEqual({
                players: [
                    {
                        id: 'user1',
                        color: Color.WHITE,
                        timer: { remainingMs: 600000 }
                    },
                    {
                        id: 'user2',
                        color: Color.BLACK,
                        timer: { remainingMs: 600000 }
                    }
                ],
                position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                lastMoveEpoch: 1234567890,
                startedAt: 1234567800
            });
        });

        it('should return null if no data exists', async () => {
            const gameId = 'game123';

            (Redis.hGetAll as jest.Mock).mockResolvedValue(null);

            const result = await gameStateRepository.get(gameId);

            expect(result).toBeNull();
        });

        it('should return null and log error if JSON parsing fails', async () => {
            const gameId = 'game123';
            const mockData = {
                players: 'invalid-json',
                position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                lastMoveEpoch: '1234567890',
                startedAt: '1234567800'
            };

            (Redis.hGetAll as jest.Mock).mockResolvedValue(mockData);

            const result = await gameStateRepository.get(gameId);

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('getKeys', () => {
        it('should call redis.keys with correct pattern and return keys', async () => {
            const mockKeys = ['game-state:game1', 'game-state:game2', 'game-state:game3'];

            (Redis.keys as jest.Mock).mockResolvedValue(mockKeys);

            const result = await gameStateRepository.getKeys();

            expect(Redis.keys).toHaveBeenCalledWith('game-state:*');
            expect(result).toEqual(mockKeys);
        });

        it('should return empty array if no keys exist', async () => {
            (Redis.keys as jest.Mock).mockResolvedValue([]);

            const result = await gameStateRepository.getKeys();

            expect(Redis.keys).toHaveBeenCalledWith('game-state:*');
            expect(result).toEqual([]);
        });
    });

    describe('remove', () => {
        it('should call redis.del with correct key', async () => {
            const gameId = 'game123';
            const expectedKey = 'game-state:game123';

            await gameStateRepository.remove(gameId);

            expect(Redis.del).toHaveBeenCalledWith(expectedKey);
        });
    });
});
