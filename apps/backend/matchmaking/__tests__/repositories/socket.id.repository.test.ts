import Redis from 'chess-game-backend-common/config/redis';
import { SocketIdRepository } from '../../src/repositories/socket.id.repository';

jest.mock('chess-game-backend-common/config/redis', () => ({
    set: jest.fn(),
    get: jest.fn()
}));

describe('SocketId Repository', () => {
    let socketIdRepository: SocketIdRepository;

    beforeEach(() => {
        socketIdRepository = new SocketIdRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('setSocketIdForUser', () => {
        it('should call redis.set with correct key pattern and socketId', () => {
            const userId = 'user123';
            const socketId = 'socket-456';
            const expectedKey = `${userId}.socketId`;

            socketIdRepository.setSocketIdForUser(userId, socketId);

            expect(Redis.set).toHaveBeenCalledWith(expectedKey, socketId);
        });
    });

    describe('getSocketIdForUser', () => {
        it('should call redis.get with correct key pattern and return socketId', async () => {
            const userId = 'user123';
            const socketId = 'socket-456';
            const expectedKey = `${userId}.socketId`;

            (Redis.get as jest.Mock).mockResolvedValue(socketId);

            const result = await socketIdRepository.getSocketIdForUser(userId);

            expect(Redis.get).toHaveBeenCalledWith(expectedKey);
            expect(result).toBe(socketId);
        });

        it('should return null if no socket id exists for user', async () => {
            const userId = 'user123';
            const expectedKey = `${userId}.socketId`;

            (Redis.get as jest.Mock).mockResolvedValue(null);

            const result = await socketIdRepository.getSocketIdForUser(userId);

            expect(Redis.get).toHaveBeenCalledWith(expectedKey);
            expect(result).toBeNull();
        });
    });
});
