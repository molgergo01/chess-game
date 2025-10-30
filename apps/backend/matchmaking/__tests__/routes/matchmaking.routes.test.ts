import request from 'supertest';
import app from '../../src/app';
import Redis from 'chess-game-backend-common/config/redis';
import { createServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { io as ioc } from 'socket.io-client';
import { Server, Socket } from 'socket.io';
import container from '../../src/config/container';
import MatchmakingService from '../../src/services/matchmaking.service';
import CoreRestClient from '../../src/clients/core.rest.client';
import { Color } from '../../src/models/game';
import { authenticatedRequest, cleanupAuthMocks, mockAuthServiceVerify } from '../fixtures/auth.fixture';

jest.mock('../../src/clients/core.rest.client');

process.env.AUTH_SERVICE_URL = 'http://localhost:8082';

jest.mock('chess-game-backend-common/config/env', () => ({
    __esModule: true,
    default: {
        PORTS: {
            CORE: '8080',
            MATCHMAKING: '8081',
            AUTH: '8082'
        },
        JWT_SECRET: 'test_jwt_secret',
        GOOGLE_CLIENT_ID: 'test_google_client_id',
        GOOGLE_CLIENT_SECRET: 'test_google_client_secret',
        NODE_ENV: 'test',
        REDIS_URL: process.env.REDIS_URL,
        REDIS_DB: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
        REDIS_TEST_DB: process.env.REDIS_TEST_DB ? parseInt(process.env.REDIS_TEST_DB) : 1,
        DB_HOST: process.env.DB_HOST,
        DB_DATABASE: process.env.DB_DATABASE,
        DB_TEST_DATABASE: process.env.DB_TEST_DATABASE,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD
    }
}));

const mockSocketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    const userId = socket.handshake.auth.userId;
    if (userId) {
        socket.data.user = {
            id: userId,
            name: 'Test User',
            email: 'test@example.com',
            elo: 1500,
            avatarUrl: 'avatar.jpg'
        };
    }
    next();
};

const onConnection = async (socket: Socket) => {
    const matchmakingService = container.get(MatchmakingService);
    await matchmakingService.setSocketIdForUser(socket.data.user!.id, socket.id);
};

describe('Matchmaking routes', () => {
    let mockCoreRestClient: jest.Mocked<CoreRestClient>;

    beforeEach(() => {
        mockCoreRestClient = container.get(CoreRestClient) as jest.Mocked<CoreRestClient>;
        mockCoreRestClient.checkActiveGame = jest.fn().mockResolvedValue(false);
        mockCoreRestClient.createGame = jest.fn();
    });

    afterEach(async () => {
        cleanupAuthMocks();
        const keys = await Redis.keys('*');
        if (keys.length > 0) {
            await Redis.del(keys);
        }
        if (container.isBound('SocketIO')) {
            await container.unbind('SocketIO');
        }
        jest.clearAllMocks();
    });

    describe('POST /api/matchmaking/queue', () => {
        it('should join queue and add user to Redis', async () => {
            const userId = 'player1';

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(request(app).post('/api/matchmaking/queue'), userId);

            expect(res.status).toBe(200);

            const queueScore = await Redis.zScore('matchmaking-queue', userId);
            expect(queueScore).not.toBeNull();
            expect(queueScore).toBeGreaterThan(0);

            const playerData = await Redis.hGetAll(`player:${userId}`);
            expect(playerData).toHaveProperty('queueTimestamp');
            expect(playerData).toHaveProperty('elo', '1500');
            expect(playerData).toHaveProperty('queueId', '');
        });

        it('should return 409 if user is already in queue', async () => {
            const userId = 'player1';

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).post('/api/matchmaking/queue'), userId);

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(request(app).post('/api/matchmaking/queue'), userId);

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('already in queue');

            const queueLength = await Redis.zCard('matchmaking-queue');
            expect(queueLength).toBe(1);
        });

        it('should add multiple different users to queue and send matchmake notifications', async () => {
            const user1 = 'player1';
            const user2 = 'player2';

            mockAuthServiceVerify({
                id: user1,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const httpServer = createServer();
            const io = new Server(httpServer);

            if (container.isBound('SocketIO')) {
                await container.unbind('SocketIO');
            }
            container.bind('SocketIO').toConstantValue(io);

            io.use(mockSocketAuthMiddleware);
            io.on('connection', onConnection);

            const serverPort = await new Promise<number>((resolve) => {
                httpServer.listen(() => {
                    resolve((httpServer.address() as AddressInfo).port);
                });
            });

            const client1 = ioc(`http://localhost:${serverPort}`, {
                auth: { userId: user1 }
            });
            const client2 = ioc(`http://localhost:${serverPort}`, {
                auth: { userId: user2 }
            });

            await Promise.all([
                new Promise<void>((resolve) => client1.on('connect', resolve)),
                new Promise<void>((resolve) => client2.on('connect', resolve))
            ]);

            await new Promise((resolve) => setTimeout(resolve, 100));

            const matchmakingService = container.get(MatchmakingService);
            const mockGameResponse = {
                gameId: 'test-game-id'
            };
            mockCoreRestClient.createGame = jest.fn().mockResolvedValue(mockGameResponse);

            const client1Promise = new Promise((resolve) => {
                client1.on('matchmake', resolve);
            });
            const client2Promise = new Promise((resolve) => {
                client2.on('matchmake', resolve);
            });

            await authenticatedRequest(request(app).post('/api/matchmaking/queue'), user1);

            mockAuthServiceVerify({
                id: user2,
                name: 'Player Two',
                email: 'player2@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).post('/api/matchmaking/queue'), user2);

            const score1 = await Redis.zScore('matchmaking-queue', user1);
            const score2 = await Redis.zScore('matchmaking-queue', user2);
            expect(score1).not.toBeNull();
            expect(score2).not.toBeNull();

            const queueLength = await Redis.zCard('matchmaking-queue');
            expect(queueLength).toBe(2);

            await new Promise((resolve) => setTimeout(resolve, 100));

            await matchmakingService.matchMake(null);

            await Promise.race([
                Promise.all([client1Promise, client2Promise]),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
            ]);

            expect(mockCoreRestClient.createGame).toHaveBeenCalledWith([user1, user2]);

            const finalQueueLength = await Redis.zCard('matchmaking-queue');
            expect(finalQueueLength).toBe(0);

            client1.disconnect();
            client2.disconnect();
            await new Promise<void>((resolve) => {
                io.close(() => {
                    httpServer.close(() => resolve());
                });
            });
        }, 10000);
    });

    describe('DELETE /api/matchmaking/queue', () => {
        it('should leave queue and remove user from Redis', async () => {
            const userId = 'player1';

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).post('/api/matchmaking/queue'), userId);

            let score = await Redis.zScore('matchmaking-queue', userId);
            expect(score).not.toBeNull();

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(request(app).delete('/api/matchmaking/queue'), userId);

            expect(res.status).toBe(200);

            score = await Redis.zScore('matchmaking-queue', userId);
            expect(score).toBeNull();

            const playerData = await Redis.exists(`player:${userId}`);
            expect(playerData).toBe(0);

            const queueLength = await Redis.zCard('matchmaking-queue');
            expect(queueLength).toBe(0);
        });

        it('should return 404 if user is not in queue', async () => {
            const userId = 'nonexistent-player';

            mockAuthServiceVerify({
                id: userId,
                name: 'Nonexistent Player',
                email: 'nonexistent@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(request(app).delete('/api/matchmaking/queue'), userId);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not in queue');
        });

        it('should only remove specified user from queue', async () => {
            const user1 = 'player1';
            const user2 = 'player2';

            mockAuthServiceVerify({
                id: user1,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).post('/api/matchmaking/queue'), user1);

            mockAuthServiceVerify({
                id: user2,
                name: 'Player Two',
                email: 'player2@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).post('/api/matchmaking/queue'), user2);

            mockAuthServiceVerify({
                id: user1,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).delete('/api/matchmaking/queue'), user1);

            const score1 = await Redis.zScore('matchmaking-queue', user1);
            const score2 = await Redis.zScore('matchmaking-queue', user2);
            expect(score1).toBeNull();
            expect(score2).not.toBeNull();

            const queueLength = await Redis.zCard('matchmaking-queue');
            expect(queueLength).toBe(1);
        });
    });

    describe('GET /api/matchmaking/queue/status', () => {
        it('should return 200 with queueId null if user is in default queue', async () => {
            const userId = 'player1';

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).post('/api/matchmaking/queue'), userId);

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(request(app).get('/api/matchmaking/queue/status'), userId);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('isQueued');
            expect(res.body.isQueued).toBe(true);
            expect(res.body).toHaveProperty('queueId');
            expect(res.body.queueId).toBeNull();
            expect(res.body).toHaveProperty('hasActiveGame');
            expect(res.body.hasActiveGame).toBe(false);
        });

        it('should return 200 with isQueued false if user is not in queue', async () => {
            const userId = 'nonexistent-player';

            mockAuthServiceVerify({
                id: userId,
                name: 'Nonexistent Player',
                email: 'nonexistent@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(request(app).get('/api/matchmaking/queue/status'), userId);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('isQueued');
            expect(res.body.isQueued).toBe(false);
            expect(res.body).toHaveProperty('queueId');
            expect(res.body.queueId).toBeNull();
            expect(res.body).toHaveProperty('hasActiveGame');
            expect(res.body.hasActiveGame).toBe(false);
        });

        it('should return 200 with isQueued false after leaving queue', async () => {
            const userId = 'player1';

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).post('/api/matchmaking/queue'), userId);

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).delete('/api/matchmaking/queue'), userId);

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(request(app).get('/api/matchmaking/queue/status'), userId);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('isQueued');
            expect(res.body.isQueued).toBe(false);
            expect(res.body).toHaveProperty('queueId');
            expect(res.body.queueId).toBeNull();
            expect(res.body).toHaveProperty('hasActiveGame');
            expect(res.body.hasActiveGame).toBe(false);
        });

        it('should return 200 with queueId when user is in private queue', async () => {
            const userId = 'player1';

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const createRes = await authenticatedRequest(request(app).post('/api/matchmaking/queue/private'), userId);
            const queueId = createRes.body.queueId;

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(request(app).get('/api/matchmaking/queue/status'), userId);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('isQueued');
            expect(res.body.isQueued).toBe(true);
            expect(res.body).toHaveProperty('queueId');
            expect(res.body.queueId).toBe(queueId);
            expect(res.body).toHaveProperty('hasActiveGame');
            expect(res.body.hasActiveGame).toBe(false);
        });

        it('should return 200 with hasActiveGame true when user has active game', async () => {
            const userId = 'player1';

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            mockCoreRestClient.checkActiveGame.mockResolvedValueOnce(true);

            const res = await authenticatedRequest(request(app).get('/api/matchmaking/queue/status'), userId);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('isQueued');
            expect(res.body.isQueued).toBe(false);
            expect(res.body).toHaveProperty('queueId');
            expect(res.body.queueId).toBeNull();
            expect(res.body).toHaveProperty('hasActiveGame');
            expect(res.body.hasActiveGame).toBe(true);
        });
    });

    describe('POST /api/matchmaking/queue/private', () => {
        it('should create private queue, return queueId, and add user to Redis', async () => {
            const userId = 'player1';

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(request(app).post('/api/matchmaking/queue/private'), userId);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('queueId');
            expect(res.body.queueId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

            const queueKey = `matchmaking-queue:${res.body.queueId}`;
            const score = await Redis.zScore(queueKey, userId);
            expect(score).not.toBeNull();
            expect(score).toBeGreaterThan(0);

            const playerData = await Redis.hGetAll(`player:${userId}`);
            expect(playerData).toHaveProperty('queueId', res.body.queueId);
        });

        it('should return 409 if user is already in queue', async () => {
            const userId = 'player1';

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).post('/api/matchmaking/queue'), userId);

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(request(app).post('/api/matchmaking/queue/private'), userId);

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('already in queue');
        });
    });

    describe('POST /api/matchmaking/queue/private/:queueId', () => {
        it('should join private queue and add user to Redis', async () => {
            const user1 = 'player1';

            mockAuthServiceVerify({
                id: user1,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const createRes = await authenticatedRequest(request(app).post('/api/matchmaking/queue/private'), user1);

            const queueId = createRes.body.queueId;
            const queueKey = `matchmaking-queue:${queueId}`;

            const score1 = await Redis.zScore(queueKey, user1);
            expect(score1).not.toBeNull();
            expect(score1).toBeGreaterThan(0);

            const queueLength = await Redis.zCard(queueKey);
            expect(queueLength).toBe(1);
        });

        it('should return 409 if user is already in queue', async () => {
            const user1 = 'player1';

            mockAuthServiceVerify({
                id: user1,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).post('/api/matchmaking/queue'), user1);

            mockAuthServiceVerify({
                id: user1,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(
                request(app).post('/api/matchmaking/queue/private/some-queue-id'),
                user1
            );

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('already in queue');
        });

        it('should return 404 if private queue does not exist', async () => {
            const userId = 'player1';
            const nonExistentQueueId = 'non-existent-queue';

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(
                request(app).post(`/api/matchmaking/queue/private/${nonExistentQueueId}`),
                userId
            );

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not found');
        });

        it('should return 404 if private queue was full and already matched', async () => {
            const user1 = 'player1';
            const user2 = 'player2';
            const user3 = 'player3';

            mockAuthServiceVerify({
                id: user1,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const httpServer = createServer();
            const io = new Server(httpServer);

            if (container.isBound('SocketIO')) {
                await container.unbind('SocketIO');
            }
            container.bind('SocketIO').toConstantValue(io);

            io.use(mockSocketAuthMiddleware);
            io.on('connection', onConnection);

            const serverPort = await new Promise<number>((resolve) => {
                httpServer.listen(() => {
                    resolve((httpServer.address() as AddressInfo).port);
                });
            });

            const client1 = ioc(`http://localhost:${serverPort}`, {
                auth: { userId: user1 }
            });
            const client2 = ioc(`http://localhost:${serverPort}`, {
                auth: { userId: user2 }
            });

            await Promise.all([
                new Promise<void>((resolve) => client1.on('connect', resolve)),
                new Promise<void>((resolve) => client2.on('connect', resolve))
            ]);

            await new Promise((resolve) => setTimeout(resolve, 100));

            const mockCoreRestClient = container.get(CoreRestClient) as jest.Mocked<CoreRestClient>;
            const mockGameResponse = {
                gameId: 'test-game-full',
                players: [
                    {
                        id: user1,
                        color: Color.WHITE,
                        timer: { remainingMs: 600000 }
                    },
                    {
                        id: user2,
                        color: Color.BLACK,
                        timer: { remainingMs: 600000 }
                    }
                ]
            };
            mockCoreRestClient.createGame = jest.fn().mockResolvedValue(mockGameResponse);

            const createRes = await authenticatedRequest(request(app).post('/api/matchmaking/queue/private'), user1);

            const queueId = createRes.body.queueId;

            mockAuthServiceVerify({
                id: user2,
                name: 'Player Two',
                email: 'player2@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).post(`/api/matchmaking/queue/private/${queueId}`), user2);

            await new Promise((resolve) => setTimeout(resolve, 100));

            mockAuthServiceVerify({
                id: user3,
                name: 'Player Three',
                email: 'player3@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(
                request(app).post(`/api/matchmaking/queue/private/${queueId}`),
                user3
            );

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not found');

            client1.disconnect();
            client2.disconnect();
            await new Promise<void>((resolve) => {
                io.close(() => {
                    httpServer.close(() => resolve());
                });
            });
        }, 10000);

        it('should trigger matchmaking when 2nd player joins and send notifications', async () => {
            const user1 = 'player1';
            const user2 = 'player2';

            mockAuthServiceVerify({
                id: user1,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const httpServer = createServer();
            const io = new Server(httpServer);

            if (container.isBound('SocketIO')) {
                await container.unbind('SocketIO');
            }
            container.bind('SocketIO').toConstantValue(io);

            io.use(mockSocketAuthMiddleware);
            io.on('connection', onConnection);

            const serverPort = await new Promise<number>((resolve) => {
                httpServer.listen(() => {
                    resolve((httpServer.address() as AddressInfo).port);
                });
            });

            const client1 = ioc(`http://localhost:${serverPort}`, {
                auth: { userId: user1 }
            });
            const client2 = ioc(`http://localhost:${serverPort}`, {
                auth: { userId: user2 }
            });

            await Promise.all([
                new Promise<void>((resolve) => client1.on('connect', resolve)),
                new Promise<void>((resolve) => client2.on('connect', resolve))
            ]);

            await new Promise((resolve) => setTimeout(resolve, 100));

            const mockGameResponse = {
                gameId: 'test-game-private'
            };
            mockCoreRestClient.createGame = jest.fn().mockResolvedValue(mockGameResponse);

            const client1Promise = new Promise((resolve) => {
                client1.on('matchmake', resolve);
            });
            const client2Promise = new Promise((resolve) => {
                client2.on('matchmake', resolve);
            });

            const createRes = await authenticatedRequest(request(app).post('/api/matchmaking/queue/private'), user1);

            const queueId = createRes.body.queueId;

            mockAuthServiceVerify({
                id: user2,
                name: 'Player Two',
                email: 'player2@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            await authenticatedRequest(request(app).post(`/api/matchmaking/queue/private/${queueId}`), user2);

            await new Promise((resolve) => setTimeout(resolve, 100));

            await Promise.race([
                Promise.all([client1Promise, client2Promise]),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
            ]);

            expect(mockCoreRestClient.createGame).toHaveBeenCalled();

            const queueKey = `matchmaking-queue:${queueId}`;
            const finalQueueLength = await Redis.zCard(queueKey);
            expect(finalQueueLength).toBe(0);

            client1.disconnect();
            client2.disconnect();
            await new Promise<void>((resolve) => {
                io.close(() => {
                    httpServer.close(() => resolve());
                });
            });
        }, 10000);
    });

    describe('DELETE /api/matchmaking/queue/private/:queueId', () => {
        it('should leave private queue and remove user from Redis', async () => {
            const userId = 'player1';

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const createRes = await authenticatedRequest(request(app).post('/api/matchmaking/queue/private'), userId);

            const queueId = createRes.body.queueId;
            const queueKey = `matchmaking-queue:${queueId}`;

            let score = await Redis.zScore(queueKey, userId);
            expect(score).not.toBeNull();

            mockAuthServiceVerify({
                id: userId,
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(
                request(app).delete(`/api/matchmaking/queue/private/${queueId}`),
                userId
            );

            expect(res.status).toBe(200);

            score = await Redis.zScore(queueKey, userId);
            expect(score).toBeNull();

            const playerData = await Redis.exists(`player:${userId}`);
            expect(playerData).toBe(0);

            const queueLength = await Redis.zCard(queueKey);
            expect(queueLength).toBe(0);
        });

        it('should return 404 if user is not in queue', async () => {
            const userId = 'nonexistent-player';
            const queueId = 'some-queue-id';

            mockAuthServiceVerify({
                id: userId,
                name: 'Nonexistent Player',
                email: 'nonexistent@example.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            });

            const res = await authenticatedRequest(
                request(app).delete(`/api/matchmaking/queue/private/${queueId}`),
                userId
            );

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not in queue');
        });
    });
});
