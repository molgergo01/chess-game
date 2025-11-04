import request from 'supertest';
import app from '../../src/app';
import db from 'chess-game-backend-common/config/db';
import { createTestUser, generateTestToken } from '../fixtures/auth.fixture';

jest.mock('chess-game-backend-common/config/env', () => ({
    __esModule: true,
    default: {
        URLS: {
            CORE: 'http://localhost:8080',
            MATCHMAKING: 'http://localhost:8081',
            AUTH: 'http://localhost:8082'
        },
        GOOGLE_CLIENT_ID: 'mocked_google_client_id',
        GOOGLE_CLIENT_SECRET: 'mocked_google_client_secret',
        JWT_SECRET: 'mocked_jwt_secret',
        FRONTEND_URL: 'http://localhost:3000',
        PORTS: {
            AUTH: '3000'
        },
        NODE_ENV: 'test',
        DB_USER: 'postgres',
        DB_PASSWORD: 'password',
        DB_TEST_DATABASE: 'chess_game_test'
    }
}));

describe('Internal Auth Routes', () => {
    let testUserId: string;

    beforeEach(async () => {
        testUserId = `test-user-1`;
        await createTestUser(testUserId, 'Test User', 'test@example.com');
    });

    afterEach(async () => {
        await db.none('DELETE FROM chess_game.users WHERE id = $1', [testUserId]);
    });

    describe('POST /internal/auth/verify', () => {
        it('should return user data when valid token in Bearer format', async () => {
            const token = generateTestToken(testUserId);
            const res = await request(app).post('/internal/auth/verify').set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.id).toBe(testUserId);
            expect(res.body.user.name).toBe('Test User');
            expect(res.body.user.email).toBe('test@example.com');
            expect(res.body.user).toHaveProperty('elo');
            expect(res.body.user).toHaveProperty('avatarUrl');
        });

        it('should return user data when valid token without Bearer prefix', async () => {
            const token = generateTestToken(testUserId);
            const res = await request(app).post('/internal/auth/verify').set('Authorization', token);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.id).toBe(testUserId);
            expect(res.body.user.name).toBe('Test User');
            expect(res.body.user.email).toBe('test@example.com');
        });

        it('should return 403 when no Authorization header', async () => {
            const res = await request(app).post('/internal/auth/verify');

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Authorization token is required');
        });

        it('should return 403 when empty Authorization header', async () => {
            const res = await request(app).post('/internal/auth/verify').set('Authorization', '');

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Authorization token is required');
        });

        it('should return 401 when invalid token', async () => {
            const res = await request(app).post('/internal/auth/verify').set('Authorization', 'Bearer invalidToken');

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid Token');
        });

        it('should return 401 when token is for non-existent user', async () => {
            const nonExistentUserId = 'non-existent-user-id';
            const token = generateTestToken(nonExistentUserId);

            const res = await request(app).post('/internal/auth/verify').set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid User in Token');
        });

        it('should return 401 when token is malformed', async () => {
            const res = await request(app)
                .post('/internal/auth/verify')
                .set('Authorization', 'Bearer malformed.token.here');

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid Token');
        });
    });
});
