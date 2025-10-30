import request from 'supertest';
import app from '../../src/app';
import Redis from 'chess-game-backend-common/config/redis';
import db from 'chess-game-backend-common/config/db';
import { authenticatedRequest, cleanupAuthMocks, mockAuthServiceVerify } from '../fixtures/auth.fixture';

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
        DB_USER: 'postgres',
        DB_PASSWORD: 'password',
        DB_TEST_DATABASE: 'chess_game_test',
        REDIS_URL: 'redis://localhost:6379',
        REDIS_TEST_DB: 1
    }
}));

const createUser = async (id: string, name: string, email: string, elo: number, avatarUrl: string) => {
    const sql = 'INSERT INTO chess_game.users (id, name, email, avatar_url, elo) VALUES ($1, $2, $3, $4, $5)';
    await db.none(sql, [id, name, email, avatarUrl, elo]);
};

describe('Leaderboard routes', () => {
    afterEach(async () => {
        cleanupAuthMocks();

        const keys = await Redis.keys('*');
        if (keys.length > 0) {
            await Redis.del(keys);
        }
        await db.none('TRUNCATE TABLE chess_game.users CASCADE');
    });

    describe('GET /api/leaderboard', () => {
        it('should return users ordered by ELO with rank, correct users data, and totalCount', async () => {
            await createUser('user1', 'Player One', 'player1@example.com', 1600, 'avatar1.com');
            await createUser('user2', 'Player Two', 'player2@example.com', 1800, 'avatar2.com');
            await createUser('user3', 'Player Three', 'player3@example.com', 1500, 'avatar3.com');
            await createUser('user4', 'Player Four', 'player4@example.com', 1700, 'avatar4.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1600,
                avatarUrl: 'avatar1.com'
            });

            const res = await authenticatedRequest(request(app).get('/api/leaderboard'), 'user1');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('users');
            expect(res.body).toHaveProperty('totalCount');
            expect(res.body.users).toHaveLength(4);
            expect(Number(res.body.totalCount)).toBe(4);

            expect(res.body.users[0].userId).toBe('user2');
            expect(res.body.users[0].name).toBe('Player Two');
            expect(res.body.users[0].elo).toBe(1800);
            expect(Number(res.body.users[0].rank)).toBe(1);
            expect(res.body.users[0].avatarUrl).toBe('avatar2.com');

            expect(res.body.users[1].userId).toBe('user4');
            expect(res.body.users[1].name).toBe('Player Four');
            expect(res.body.users[1].elo).toBe(1700);
            expect(Number(res.body.users[1].rank)).toBe(2);

            expect(res.body.users[2].userId).toBe('user1');
            expect(res.body.users[2].name).toBe('Player One');
            expect(res.body.users[2].elo).toBe(1600);
            expect(Number(res.body.users[2].rank)).toBe(3);

            expect(res.body.users[3].userId).toBe('user3');
            expect(res.body.users[3].name).toBe('Player Three');
            expect(res.body.users[3].elo).toBe(1500);
            expect(Number(res.body.users[3].rank)).toBe(4);
        });

        it('should apply limit parameter correctly', async () => {
            await createUser('user1', 'Player One', 'player1@example.com', 1600, 'avatar1.com');
            await createUser('user2', 'Player Two', 'player2@example.com', 1800, 'avatar2.com');
            await createUser('user3', 'Player Three', 'player3@example.com', 1500, 'avatar3.com');
            await createUser('user4', 'Player Four', 'player4@example.com', 1700, 'avatar4.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1600,
                avatarUrl: 'avatar1.com'
            });

            const res = await authenticatedRequest(request(app).get('/api/leaderboard'), 'user1').query({
                limit: '2'
            });

            expect(res.status).toBe(200);
            expect(res.body.users).toHaveLength(2);
            expect(Number(res.body.totalCount)).toBe(4);
            expect(res.body.users[0].userId).toBe('user2');
            expect(res.body.users[1].userId).toBe('user4');
        });

        it('should apply offset parameter correctly', async () => {
            await createUser('user1', 'Player One', 'player1@example.com', 1600, 'avatar1.com');
            await createUser('user2', 'Player Two', 'player2@example.com', 1800, 'avatar2.com');
            await createUser('user3', 'Player Three', 'player3@example.com', 1500, 'avatar3.com');
            await createUser('user4', 'Player Four', 'player4@example.com', 1700, 'avatar4.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1600,
                avatarUrl: 'avatar1.com'
            });

            const res = await authenticatedRequest(request(app).get('/api/leaderboard'), 'user1').query({
                offset: '1'
            });

            expect(res.status).toBe(200);
            expect(res.body.users).toHaveLength(3);
            expect(Number(res.body.totalCount)).toBe(4);
            expect(res.body.users[0].userId).toBe('user4');
            expect(res.body.users[1].userId).toBe('user1');
            expect(res.body.users[2].userId).toBe('user3');
        });

        it('should apply both limit and offset correctly', async () => {
            await createUser('user1', 'Player One', 'player1@example.com', 1600, 'avatar1.com');
            await createUser('user2', 'Player Two', 'player2@example.com', 1800, 'avatar2.com');
            await createUser('user3', 'Player Three', 'player3@example.com', 1500, 'avatar3.com');
            await createUser('user4', 'Player Four', 'player4@example.com', 1700, 'avatar4.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1600,
                avatarUrl: 'avatar1.com'
            });

            const res = await authenticatedRequest(request(app).get('/api/leaderboard'), 'user1').query({
                limit: '2',
                offset: '1'
            });

            expect(res.status).toBe(200);
            expect(res.body.users).toHaveLength(2);
            expect(Number(res.body.totalCount)).toBe(4);
            expect(res.body.users[0].userId).toBe('user4');
            expect(res.body.users[1].userId).toBe('user1');
        });

        it('should return empty array when no users exist', async () => {
            mockAuthServiceVerify({
                id: 'user1',
                name: 'Player One',
                email: 'player1@example.com',
                elo: 1600,
                avatarUrl: 'avatar1.com'
            });

            const res = await authenticatedRequest(request(app).get('/api/leaderboard'), 'user1');

            expect(res.status).toBe(200);
            expect(res.body.users).toEqual([]);
            expect(Number(res.body.totalCount)).toBe(0);
        });
    });
});
