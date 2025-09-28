import Redis from 'chess-game-backend-common/config/redis';
import QueueRepository from '../../src/repositories/queue.repository';

jest.mock('chess-game-backend-common/config/redis', () => ({
    lPush: jest.fn(),
    rPush: jest.fn(),
    lRem: jest.fn(),
    lLen: jest.fn(),
    rPopCount: jest.fn(),
    lPos: jest.fn()
}));

describe('Queue Repository', () => {
    let queueRepository: QueueRepository;

    beforeEach(() => {
        queueRepository = new QueueRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('pushToQueueEnd', () => {
        it('should call redis.lPush with correct key and userId', () => {
            const userId = 'user123';
            const expectedKey = 'matchmaking-queue';

            queueRepository.pushToQueueEnd(userId);

            expect(Redis.lPush).toHaveBeenCalledWith(expectedKey, userId);
        });
    });

    describe('pushToQueueFront', () => {
        it('should call redis.rPush with correct key and userId', () => {
            const userId = 'user123';
            const expectedKey = 'matchmaking-queue';

            queueRepository.pushToQueueFront(userId);

            expect(Redis.rPush).toHaveBeenCalledWith(expectedKey, userId);
        });
    });

    describe('removeFromQueue', () => {
        it('should call redis.lRem with correct key and userId', () => {
            const userId = 'user123';
            const expectedKey = 'matchmaking-queue';

            queueRepository.removeFromQueue(userId);

            expect(Redis.lRem).toHaveBeenCalledWith(expectedKey, 1, userId);
        });
    });

    describe('getQueueCount', () => {
        it('should call redis.lLen with correct key and return count', async () => {
            const expectedKey = 'matchmaking-queue';
            const expectedCount = 5;

            (Redis.lLen as jest.Mock).mockResolvedValue(expectedCount);

            const result = await queueRepository.getQueueCount();

            expect(Redis.lLen).toHaveBeenCalledWith(expectedKey);
            expect(result).toBe(expectedCount);
        });
    });

    describe('popQueue', () => {
        it('should call redis.rPopCount with correct key and count', async () => {
            const expectedKey = 'matchmaking-queue';
            const expectedPlayers = ['user1', 'user2'];

            (Redis.rPopCount as jest.Mock).mockResolvedValue(expectedPlayers);

            const result = await queueRepository.popQueue();

            expect(Redis.rPopCount).toHaveBeenCalledWith(expectedKey, 2);
            expect(result).toEqual(expectedPlayers);
        });

        it('should return null if no players available', async () => {
            const expectedKey = 'matchmaking-queue';

            (Redis.rPopCount as jest.Mock).mockResolvedValue(null);

            const result = await queueRepository.popQueue();

            expect(Redis.rPopCount).toHaveBeenCalledWith(expectedKey, 2);
            expect(result).toBeNull();
        });
    });

    describe('isInQueue', () => {
        it('should return true if user is in queue', async () => {
            const userId = 'user123';
            const expectedKey = 'matchmaking-queue';

            (Redis.lPos as jest.Mock).mockResolvedValue(0);

            const result = await queueRepository.isInQueue(userId);

            expect(Redis.lPos).toHaveBeenCalledWith(expectedKey, userId);
            expect(result).toBe(true);
        });

        it('should return false if user is not in queue', async () => {
            const userId = 'user123';
            const expectedKey = 'matchmaking-queue';

            (Redis.lPos as jest.Mock).mockResolvedValue(null);

            const result = await queueRepository.isInQueue(userId);

            expect(Redis.lPos).toHaveBeenCalledWith(expectedKey, userId);
            expect(result).toBe(false);
        });
    });
});
