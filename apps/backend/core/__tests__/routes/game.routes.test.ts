import request from 'supertest';
import app from '../../src/app';
import Redis from 'chess-game-backend-common/config/redis';

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

describe('Game routes', () => {
    afterEach(async () => {
        const keys = await Redis.keys('*');
        if (keys.length > 0) {
            await Redis.del(keys);
        }
    });

    afterAll(async () => {
        await Redis.quit();
    });

    describe('POST /api/game', () => {
        it('should create a game with valid players and persist to Redis', async () => {
            const players = ['player1', 'player2'];
            const res = await request(app).post('/api/game').send({ players });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('gameId');
            expect(res.body).toHaveProperty('players');
            expect(res.body.players).toHaveLength(2);

            const gameId = res.body.gameId;

            const gameState = await Redis.hGetAll(`game-state:${gameId}`);
            expect(gameState).toBeDefined();
            expect(gameState.position).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
            expect(gameState.players).toBeDefined();
            const storedPlayers = JSON.parse(gameState.players);
            expect(storedPlayers).toHaveLength(2);
            expect(gameState.lastMoveEpoch).toBe('0');
            expect(gameState.startedAt).toBeDefined();

            const player1GameId = await Redis.get('game-id:player1');
            const player2GameId = await Redis.get('game-id:player2');
            expect(player1GameId).toBe(gameId);
            expect(player2GameId).toBe(gameId);
        });

        it('should return 400 if players array has only 1 player', async () => {
            const players = ['player1'];
            const res = await request(app).post('/api/game').send({ players });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Chess game requires exactly 2 players');

            const keys = await Redis.keys('game-id*');
            expect(keys).toHaveLength(0);
        });

        it('should return 400 if players array has more than 2 players', async () => {
            const players = ['player1', 'player2', 'player3'];
            const res = await request(app).post('/api/game').send({ players });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Chess game requires exactly 2 players');

            const keys = await Redis.keys('game-id*');
            expect(keys).toHaveLength(0);
        });
    });
});
