import Redis from 'chess-game-backend-common/config/redis';
import GameIdRepository from '../../src/repositories/gameId.repository';

jest.mock('chess-game-backend-common/config/redis', () => ({
    set: jest.fn(),
    get: jest.fn(),
    keys: jest.fn(),
    del: jest.fn()
}));

describe('GameId Repository', () => {
    let gameIdRepository: GameIdRepository;

    beforeEach(() => {
        gameIdRepository = new GameIdRepository(Redis);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('save', () => {
        it('should call redis.set with correct key pattern and parameters', async () => {
            const userId = 'user123';
            const gameId = 'game456';
            const expectedKey = 'game-id:user123';

            await gameIdRepository.save(userId, gameId);

            expect(Redis.set).toHaveBeenCalledWith(expectedKey, gameId);
        });
    });

    describe('get', () => {
        it('should call redis.get with correct key pattern', async () => {
            const userId = 'user123';
            const expectedKey = 'game-id:user123';
            const gameId = 'game456';

            (Redis.get as jest.Mock).mockResolvedValue(gameId);

            const result = await gameIdRepository.get(userId);

            expect(Redis.get).toHaveBeenCalledWith(expectedKey);
            expect(result).toBe(gameId);
        });

        it('should return null if no game id exists for user', async () => {
            const userId = 'user123';
            const expectedKey = 'game-id:user123';

            (Redis.get as jest.Mock).mockResolvedValue(null);

            const result = await gameIdRepository.get(userId);

            expect(Redis.get).toHaveBeenCalledWith(expectedKey);
            expect(result).toBeNull();
        });
    });

    describe('remove', () => {
        it('should delete all keys matching the gameId', async () => {
            const gameId = 'game456';
            const mockKeys = ['game-id:user1', 'game-id:user2', 'game-id:user3'];

            (Redis.keys as jest.Mock).mockResolvedValue(mockKeys);
            (Redis.get as jest.Mock)
                .mockResolvedValueOnce('game456')
                .mockResolvedValueOnce('other-game')
                .mockResolvedValueOnce('game456');

            await gameIdRepository.remove(gameId);

            expect(Redis.keys).toHaveBeenCalledWith('game-id:*');
            expect(Redis.get).toHaveBeenCalledTimes(3);
            expect(Redis.del).toHaveBeenCalledTimes(2);
            expect(Redis.del).toHaveBeenCalledWith('game-id:user1');
            expect(Redis.del).toHaveBeenCalledWith('game-id:user3');
        });

        it('should return early if no keys match the pattern', async () => {
            const gameId = 'game456';

            (Redis.keys as jest.Mock).mockResolvedValue([]);

            await gameIdRepository.remove(gameId);

            expect(Redis.keys).toHaveBeenCalledWith('game-id:*');
            expect(Redis.get).not.toHaveBeenCalled();
            expect(Redis.del).not.toHaveBeenCalled();
        });

        it('should not delete keys if no values match the gameId', async () => {
            const gameId = 'game456';
            const mockKeys = ['game-id:user1', 'game-id:user2'];

            (Redis.keys as jest.Mock).mockResolvedValue(mockKeys);
            (Redis.get as jest.Mock)
                .mockResolvedValueOnce('other-game1')
                .mockResolvedValueOnce('other-game2');

            await gameIdRepository.remove(gameId);

            expect(Redis.keys).toHaveBeenCalledWith('game-id:*');
            expect(Redis.get).toHaveBeenCalledTimes(2);
            expect(Redis.del).not.toHaveBeenCalled();
        });
    });
});
