import request from 'supertest';
import app from '../../src/app';
import Redis from 'chess-game-backend-common/config/redis';
import { createServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { io as ioc } from 'socket.io-client';
import { Server } from 'socket.io';
import { onConnection } from '../../src/server';
import container from '../../src/config/container';
import MatchmakingService from '../../src/services/matchmaking.service';
import CoreRestClient from '../../src/clients/core.rest.client';
import { Color } from '../../src/models/game';

jest.mock('../../src/clients/core.rest.client');

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

describe('Matchmaking routes', () => {
    let mockCoreRestClient: jest.Mocked<CoreRestClient>;

    beforeEach(() => {
        mockCoreRestClient = container.get(CoreRestClient) as jest.Mocked<CoreRestClient>;
        mockCoreRestClient.checkActiveGame = jest.fn().mockResolvedValue(false);
    });

    afterEach(async () => {
        let cursor = '0';
        do {
            const result = await Redis.scan(cursor, {
                MATCH: 'matchmaking-queue*',
                COUNT: 100
            });
            cursor = result.cursor;
            if (result.keys.length > 0) {
                await Redis.del(result.keys);
            }
        } while (cursor !== '0');
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await Redis.quit();
    });

    describe('POST /api/matchmaking/queue', () => {
        it('should join queue and add user to Redis', async () => {
            const userId = 'player1';
            const res = await request(app).post('/api/matchmaking/queue').send({ userId });

            expect(res.status).toBe(200);

            const position = await Redis.lPos('matchmaking-queue', userId);
            expect(position).not.toBeNull();
            expect(position).toBeGreaterThanOrEqual(0);
        });

        it('should return 409 if user is already in queue', async () => {
            const userId = 'player1';

            await request(app).post('/api/matchmaking/queue').send({ userId });

            const res = await request(app).post('/api/matchmaking/queue').send({ userId });

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('already in queue');

            const queueLength = await Redis.lLen('matchmaking-queue');
            expect(queueLength).toBe(1);
        });

        it('should add multiple different users to queue and send matchmake notifications', async () => {
            const user1 = 'player1';
            const user2 = 'player2';

            const httpServer = createServer();
            const io = new Server(httpServer);

            if (container.isBound('SocketIO')) {
                await container.unbind('SocketIO');
            }
            container.bind('SocketIO').toConstantValue(io);

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
                gameId: 'test-game-id'
            };
            mockCoreRestClient.createGame = jest.fn().mockResolvedValue(mockGameResponse);

            const client1Promise = new Promise((resolve) => {
                client1.on('matchmake', resolve);
            });
            const client2Promise = new Promise((resolve) => {
                client2.on('matchmake', resolve);
            });

            await request(app).post('/api/matchmaking/queue').send({
                userId: user1
            });
            await request(app).post('/api/matchmaking/queue').send({
                userId: user2
            });

            const position1 = await Redis.lPos('matchmaking-queue', user1);
            const position2 = await Redis.lPos('matchmaking-queue', user2);
            expect(position1).not.toBeNull();
            expect(position2).not.toBeNull();

            const queueLength = await Redis.lLen('matchmaking-queue');
            expect(queueLength).toBe(2);

            const matchmakingService = container.get(MatchmakingService);
            await matchmakingService.matchMake(null);

            const [message1, message2] = await Promise.race([
                Promise.all([client1Promise, client2Promise]),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
            ]);

            expect(message1).toEqual(mockGameResponse);
            expect(message2).toEqual(mockGameResponse);

            const finalQueueLength = await Redis.lLen('matchmaking-queue');
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

            await request(app).post('/api/matchmaking/queue').send({ userId });

            let position = await Redis.lPos('matchmaking-queue', userId);
            expect(position).not.toBeNull();

            const res = await request(app).delete('/api/matchmaking/queue').send({ userId });

            expect(res.status).toBe(200);

            position = await Redis.lPos('matchmaking-queue', userId);
            expect(position).toBeNull();

            const queueLength = await Redis.lLen('matchmaking-queue');
            expect(queueLength).toBe(0);
        });

        it('should return 404 if user is not in queue', async () => {
            const userId = 'nonexistent-player';

            const res = await request(app).delete('/api/matchmaking/queue').send({ userId });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not in queue');
        });

        it('should only remove specified user from queue', async () => {
            const user1 = 'player1';
            const user2 = 'player2';

            await request(app).post('/api/matchmaking/queue').send({
                userId: user1
            });
            await request(app).post('/api/matchmaking/queue').send({
                userId: user2
            });

            await request(app).delete('/api/matchmaking/queue').send({ userId: user1 });

            const position1 = await Redis.lPos('matchmaking-queue', user1);
            const position2 = await Redis.lPos('matchmaking-queue', user2);
            expect(position1).toBeNull();
            expect(position2).not.toBeNull();

            const queueLength = await Redis.lLen('matchmaking-queue');
            expect(queueLength).toBe(1);
        });
    });

    describe('GET /api/matchmaking/queue/status', () => {
        it('should return 200 with queueId null if user is in default queue', async () => {
            const userId = 'player1';

            await request(app).post('/api/matchmaking/queue').send({ userId });

            const res = await request(app).get('/api/matchmaking/queue/status').query({ userId });

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

            const res = await request(app).get('/api/matchmaking/queue/status').query({ userId });

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

            await request(app).post('/api/matchmaking/queue').send({ userId });
            await request(app).delete('/api/matchmaking/queue').send({ userId });

            const res = await request(app).get('/api/matchmaking/queue/status').query({ userId });

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

            const createRes = await request(app).post('/api/matchmaking/queue/private').send({ userId });
            const queueId = createRes.body.queueId;

            const res = await request(app).get('/api/matchmaking/queue/status').query({ userId });

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

            mockCoreRestClient.checkActiveGame.mockResolvedValueOnce(true);

            const res = await request(app).get('/api/matchmaking/queue/status').query({ userId });

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

            const res = await request(app).post('/api/matchmaking/queue/private').send({ userId });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('queueId');
            expect(res.body.queueId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

            const queueKey = `matchmaking-queue:${res.body.queueId}`;
            const position = await Redis.lPos(queueKey, userId);
            expect(position).not.toBeNull();
            expect(position).toBeGreaterThanOrEqual(0);
        });

        it('should return 409 if user is already in queue', async () => {
            const userId = 'player1';

            await request(app).post('/api/matchmaking/queue').send({ userId });

            const res = await request(app).post('/api/matchmaking/queue/private').send({ userId });

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('already in queue');
        });
    });

    describe('POST /api/matchmaking/queue/private/:queueId', () => {
        it('should join private queue and add user to Redis', async () => {
            const user1 = 'player1';

            const createRes = await request(app).post('/api/matchmaking/queue/private').send({ userId: user1 });

            const queueId = createRes.body.queueId;
            const queueKey = `matchmaking-queue:${queueId}`;

            const position1 = await Redis.lPos(queueKey, user1);
            expect(position1).not.toBeNull();
            expect(position1).toBe(0);

            const queueLength = await Redis.lLen(queueKey);
            expect(queueLength).toBe(1);
        });

        it('should return 409 if user is already in queue', async () => {
            const user1 = 'player1';

            await request(app).post('/api/matchmaking/queue').send({ userId: user1 });

            const res = await request(app).post('/api/matchmaking/queue/private/some-queue-id').send({ userId: user1 });

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('already in queue');
        });

        it('should return 404 if private queue does not exist', async () => {
            const userId = 'player1';
            const nonExistentQueueId = 'non-existent-queue';

            const res = await request(app)
                .post(`/api/matchmaking/queue/private/${nonExistentQueueId}`)
                .send({ userId });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not found');
        });

        it('should return 404 if private queue was full and already matched', async () => {
            const user1 = 'player1';
            const user2 = 'player2';
            const user3 = 'player3';

            const httpServer = createServer();
            const io = new Server(httpServer);

            if (container.isBound('SocketIO')) {
                await container.unbind('SocketIO');
            }
            container.bind('SocketIO').toConstantValue(io);

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

            const createRes = await request(app).post('/api/matchmaking/queue/private').send({ userId: user1 });

            const queueId = createRes.body.queueId;

            await request(app).post(`/api/matchmaking/queue/private/${queueId}`).send({ userId: user2 });

            await new Promise((resolve) => setTimeout(resolve, 100));

            const res = await request(app).post(`/api/matchmaking/queue/private/${queueId}`).send({ userId: user3 });

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

            const httpServer = createServer();
            const io = new Server(httpServer);

            if (container.isBound('SocketIO')) {
                await container.unbind('SocketIO');
            }
            container.bind('SocketIO').toConstantValue(io);

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
                gameId: 'test-game-private'
            };
            mockCoreRestClient.createGame = jest.fn().mockResolvedValue(mockGameResponse);

            const client1Promise = new Promise((resolve) => {
                client1.on('matchmake', resolve);
            });
            const client2Promise = new Promise((resolve) => {
                client2.on('matchmake', resolve);
            });

            const createRes = await request(app).post('/api/matchmaking/queue/private').send({ userId: user1 });

            const queueId = createRes.body.queueId;

            await request(app).post(`/api/matchmaking/queue/private/${queueId}`).send({ userId: user2 });

            const [message1, message2] = await Promise.race([
                Promise.all([client1Promise, client2Promise]),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
            ]);

            expect(message1).toEqual(mockGameResponse);
            expect(message2).toEqual(mockGameResponse);

            const queueKey = `matchmaking-queue:${queueId}`;
            const finalQueueLength = await Redis.lLen(queueKey);
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

            const createRes = await request(app).post('/api/matchmaking/queue/private').send({ userId });

            const queueId = createRes.body.queueId;
            const queueKey = `matchmaking-queue:${queueId}`;

            let position = await Redis.lPos(queueKey, userId);
            expect(position).not.toBeNull();

            const res = await request(app).delete(`/api/matchmaking/queue/private/${queueId}`).send({ userId });

            expect(res.status).toBe(200);

            position = await Redis.lPos(queueKey, userId);
            expect(position).toBeNull();

            const queueLength = await Redis.lLen(queueKey);
            expect(queueLength).toBe(0);
        });

        it('should return 404 if user is not in queue', async () => {
            const userId = 'nonexistent-player';
            const queueId = 'some-queue-id';

            const res = await request(app).delete(`/api/matchmaking/queue/private/${queueId}`).send({ userId });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not in queue');
        });
    });
});
