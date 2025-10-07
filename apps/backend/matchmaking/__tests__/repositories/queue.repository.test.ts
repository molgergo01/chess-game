import Redis from 'chess-game-backend-common/config/redis';
import QueueRepository from '../../src/repositories/queue.repository';

jest.mock('chess-game-backend-common/config/redis', () => ({
    lPush: jest.fn(),
    rPush: jest.fn(),
    lRem: jest.fn(),
    lLen: jest.fn(),
    rPopCount: jest.fn(),
    lPos: jest.fn(),
    scan: jest.fn()
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
        it('should call redis.lPush with default queue key when queueId is null', () => {
            const userId = 'user123';
            const expectedKey = 'matchmaking-queue';

            queueRepository.pushToQueueEnd(userId, null);

            expect(Redis.lPush).toHaveBeenCalledWith(expectedKey, userId);
        });

        it('should call redis.lPush with specific queue key when queueId is provided', () => {
            const userId = 'user123';
            const queueId = 'game-123';
            const expectedKey = 'matchmaking-queue:game-123';

            queueRepository.pushToQueueEnd(userId, queueId);

            expect(Redis.lPush).toHaveBeenCalledWith(expectedKey, userId);
        });
    });

    describe('pushToQueueFront', () => {
        it('should call redis.rPush with default queue key when queueId is null', () => {
            const userId = 'user123';
            const expectedKey = 'matchmaking-queue';

            queueRepository.pushToQueueFront(userId, null);

            expect(Redis.rPush).toHaveBeenCalledWith(expectedKey, userId);
        });

        it('should call redis.rPush with specific queue key when queueId is provided', () => {
            const userId = 'user123';
            const queueId = 'invite-456';
            const expectedKey = 'matchmaking-queue:invite-456';

            queueRepository.pushToQueueFront(userId, queueId);

            expect(Redis.rPush).toHaveBeenCalledWith(expectedKey, userId);
        });
    });

    describe('removeFromQueue', () => {
        it('should call redis.lRem with default queue key when queueId is null', () => {
            const userId = 'user123';
            const expectedKey = 'matchmaking-queue';

            queueRepository.removeFromQueue(userId, null);

            expect(Redis.lRem).toHaveBeenCalledWith(expectedKey, 1, userId);
        });

        it('should call redis.lRem with specific queue key when queueId is provided', () => {
            const userId = 'user123';
            const queueId = 'room-789';
            const expectedKey = 'matchmaking-queue:room-789';

            queueRepository.removeFromQueue(userId, queueId);

            expect(Redis.lRem).toHaveBeenCalledWith(expectedKey, 1, userId);
        });
    });

    describe('getQueueCount', () => {
        it('should call redis.lLen with default queue key when queueId is null', async () => {
            const expectedKey = 'matchmaking-queue';
            const expectedCount = 5;

            (Redis.lLen as jest.Mock).mockResolvedValue(expectedCount);

            const result = await queueRepository.getQueueCount(null);

            expect(Redis.lLen).toHaveBeenCalledWith(expectedKey);
            expect(result).toBe(expectedCount);
        });

        it('should call redis.lLen with specific queue key when queueId is provided', async () => {
            const queueId = 'lobby-101';
            const expectedKey = 'matchmaking-queue:lobby-101';
            const expectedCount = 3;

            (Redis.lLen as jest.Mock).mockResolvedValue(expectedCount);

            const result = await queueRepository.getQueueCount(queueId);

            expect(Redis.lLen).toHaveBeenCalledWith(expectedKey);
            expect(result).toBe(expectedCount);
        });
    });

    describe('popQueue', () => {
        it('should call redis.rPopCount with default queue key when queueId is null', async () => {
            const expectedKey = 'matchmaking-queue';
            const expectedPlayers = ['user1', 'user2'];

            (Redis.rPopCount as jest.Mock).mockResolvedValue(expectedPlayers);

            const result = await queueRepository.popQueue(null);

            expect(Redis.rPopCount).toHaveBeenCalledWith(expectedKey, 2);
            expect(result).toEqual(expectedPlayers);
        });

        it('should call redis.rPopCount with specific queue key when queueId is provided', async () => {
            const queueId = 'match-202';
            const expectedKey = 'matchmaking-queue:match-202';
            const expectedPlayers = ['user3', 'user4'];

            (Redis.rPopCount as jest.Mock).mockResolvedValue(expectedPlayers);

            const result = await queueRepository.popQueue(queueId);

            expect(Redis.rPopCount).toHaveBeenCalledWith(expectedKey, 2);
            expect(result).toEqual(expectedPlayers);
        });

        it('should return null if no players available', async () => {
            const expectedKey = 'matchmaking-queue';

            (Redis.rPopCount as jest.Mock).mockResolvedValue(null);

            const result = await queueRepository.popQueue(null);

            expect(Redis.rPopCount).toHaveBeenCalledWith(expectedKey, 2);
            expect(result).toBeNull();
        });
    });

    describe('getQueueId', () => {
        it('should return empty string when user is in default queue', async () => {
            const userId = 'user123';

            (Redis.scan as jest.Mock).mockResolvedValue({
                cursor: '0',
                keys: ['matchmaking-queue']
            });
            (Redis.lPos as jest.Mock).mockResolvedValue(0);

            const result = await queueRepository.getQueueId(userId);

            expect(Redis.scan).toHaveBeenCalledWith('0', {
                MATCH: 'matchmaking-queue*',
                COUNT: 100
            });
            expect(Redis.lPos).toHaveBeenCalledWith('matchmaking-queue', userId);
            expect(result).toBe('');
        });

        it('should return queueId when user is in specific queue', async () => {
            const userId = 'user456';

            (Redis.scan as jest.Mock).mockResolvedValue({
                cursor: '0',
                keys: ['matchmaking-queue:custom-789']
            });
            (Redis.lPos as jest.Mock).mockResolvedValue(2);

            const result = await queueRepository.getQueueId(userId);

            expect(Redis.scan).toHaveBeenCalledWith('0', {
                MATCH: 'matchmaking-queue*',
                COUNT: 100
            });
            expect(Redis.lPos).toHaveBeenCalledWith('matchmaking-queue:custom-789', userId);
            expect(result).toBe('custom-789');
        });

        it('should return null when user is not in any queue', async () => {
            const userId = 'user789';

            (Redis.scan as jest.Mock).mockResolvedValue({
                cursor: '0',
                keys: ['matchmaking-queue', 'matchmaking-queue:test']
            });
            (Redis.lPos as jest.Mock).mockResolvedValue(null);

            const result = await queueRepository.getQueueId(userId);

            expect(Redis.scan).toHaveBeenCalledWith('0', {
                MATCH: 'matchmaking-queue*',
                COUNT: 100
            });
            expect(result).toBeNull();
        });

        it('should scan multiple times with cursor pagination', async () => {
            const userId = 'user101';

            (Redis.scan as jest.Mock)
                .mockResolvedValueOnce({
                    cursor: '5',
                    keys: ['matchmaking-queue']
                })
                .mockResolvedValueOnce({
                    cursor: '0',
                    keys: ['matchmaking-queue:found-here']
                });
            (Redis.lPos as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(1);

            const result = await queueRepository.getQueueId(userId);

            expect(Redis.scan).toHaveBeenCalledTimes(2);
            expect(Redis.scan).toHaveBeenNthCalledWith(1, '0', {
                MATCH: 'matchmaking-queue*',
                COUNT: 100
            });
            expect(Redis.scan).toHaveBeenNthCalledWith(2, '5', {
                MATCH: 'matchmaking-queue*',
                COUNT: 100
            });
            expect(result).toBe('found-here');
        });

        it('should stop scanning when user is found', async () => {
            const userId = 'user202';

            (Redis.scan as jest.Mock).mockResolvedValue({
                cursor: '10',
                keys: ['matchmaking-queue:early-match', 'matchmaking-queue:should-not-check']
            });
            (Redis.lPos as jest.Mock).mockResolvedValueOnce(3);

            const result = await queueRepository.getQueueId(userId);

            expect(Redis.lPos).toHaveBeenCalledTimes(1);
            expect(Redis.lPos).toHaveBeenCalledWith('matchmaking-queue:early-match', userId);
            expect(result).toBe('early-match');
        });

        it('should return null when no queues exist', async () => {
            const userId = 'user303';

            (Redis.scan as jest.Mock).mockResolvedValue({
                cursor: '0',
                keys: []
            });

            const result = await queueRepository.getQueueId(userId);

            expect(Redis.scan).toHaveBeenCalledWith('0', {
                MATCH: 'matchmaking-queue*',
                COUNT: 100
            });
            expect(Redis.lPos).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });
});
