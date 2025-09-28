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
        REDIS_TEST_DB: process.env.REDIS_TEST_DB
            ? parseInt(process.env.REDIS_TEST_DB)
            : 1,
        DB_HOST: process.env.DB_HOST,
        DB_DATABASE: process.env.DB_DATABASE,
        DB_TEST_DATABASE: process.env.DB_TEST_DATABASE,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD
    }
}));

describe('Matchmaking routes', () => {
    afterEach(async () => {
        const queueLength = await Redis.lLen('matchmaking-queue');
        if (queueLength > 0) {
            await Redis.del('matchmaking-queue');
        }
    });

    afterAll(async () => {
        await Redis.quit();
    });

    describe('POST /api/matchmaking/queue', () => {
        it('should join queue and add user to Redis', async () => {
            const userId = 'player1';
            const res = await request(app)
                .post('/api/matchmaking/queue')
                .send({ userId });

            expect(res.status).toBe(200);

            const position = await Redis.lPos('matchmaking-queue', userId);
            expect(position).not.toBeNull();
            expect(position).toBeGreaterThanOrEqual(0);
        });

        it('should return 409 if user is already in queue', async () => {
            const userId = 'player1';

            await request(app).post('/api/matchmaking/queue').send({ userId });

            const res = await request(app)
                .post('/api/matchmaking/queue')
                .send({ userId });

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

            const mockCoreRestClient = container.get(
                CoreRestClient
            ) as jest.Mocked<CoreRestClient>;
            const mockGameResponse = {
                gameId: 'test-game-id',
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
            mockCoreRestClient.createGame = jest
                .fn()
                .mockResolvedValue(mockGameResponse);

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
            await matchmakingService.matchMake();

            const [message1, message2] = await Promise.race([
                Promise.all([client1Promise, client2Promise]),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 3000)
                )
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

    describe('DELETE /api/matchmaking/queue/:userId', () => {
        it('should leave queue and remove user from Redis', async () => {
            const userId = 'player1';

            await request(app).post('/api/matchmaking/queue').send({ userId });

            let position = await Redis.lPos('matchmaking-queue', userId);
            expect(position).not.toBeNull();

            const res = await request(app).delete(
                `/api/matchmaking/queue/${userId}`
            );

            expect(res.status).toBe(200);

            position = await Redis.lPos('matchmaking-queue', userId);
            expect(position).toBeNull();

            const queueLength = await Redis.lLen('matchmaking-queue');
            expect(queueLength).toBe(0);
        });

        it('should return 404 if user is not in queue', async () => {
            const userId = 'nonexistent-player';

            const res = await request(app).delete(
                `/api/matchmaking/queue/${userId}`
            );

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

            await request(app).delete(`/api/matchmaking/queue/${user1}`);

            const position1 = await Redis.lPos('matchmaking-queue', user1);
            const position2 = await Redis.lPos('matchmaking-queue', user2);
            expect(position1).toBeNull();
            expect(position2).not.toBeNull();

            const queueLength = await Redis.lLen('matchmaking-queue');
            expect(queueLength).toBe(1);
        });
    });

    describe('GET /api/matchmaking/queue/:userId', () => {
        it('should return 200 if user is in queue', async () => {
            const userId = 'player1';

            await request(app).post('/api/matchmaking/queue').send({ userId });

            const res = await request(app).get(
                `/api/matchmaking/queue/${userId}`
            );

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('is queued');
        });

        it('should return 404 if user is not in queue', async () => {
            const userId = 'nonexistent-player';

            const res = await request(app).get(
                `/api/matchmaking/queue/${userId}`
            );

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not queued');
        });

        it('should return 404 if user was in queue but left', async () => {
            const userId = 'player1';

            await request(app).post('/api/matchmaking/queue').send({ userId });
            await request(app).delete(`/api/matchmaking/queue/${userId}`);

            const res = await request(app).get(
                `/api/matchmaking/queue/${userId}`
            );

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not queued');
        });
    });
});
