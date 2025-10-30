import request from 'supertest';
import app from '../../src/app';
import db from 'chess-game-backend-common/config/db';
import { authenticatedRequest, createTestUser, generateTestToken } from '../fixtures/auth.fixture';

jest.mock('chess-game-backend-common/config/env', () => ({
    __esModule: true,
    default: {
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

describe('Authentication routes', () => {
    let testUserId: string;

    beforeEach(async () => {
        testUserId = `test-user-1`;
        await createTestUser(testUserId, 'Test User', 'test@example.com');
    });

    afterEach(async () => {
        await db.none('DELETE FROM chess_game.users WHERE id = $1', [testUserId]);
    });

    describe('GET /api/auth/google', () => {
        it('should redirect to google', async () => {
            const res = await request(app).get('/api/auth/google');

            expect(res.status).toBe(302);
            expect(res.headers['location']).toContain('https://accounts.google.com');
        });
    });

    describe('GET /api/auth/google/callback', () => {
        it('should login user', async () => {});
    });

    describe('POST /api/auth/logout', () => {
        it('should clear cookies', async () => {
            const res = await authenticatedRequest(request(app).post('/api/auth/logout'), testUserId);

            expect(res.status).toBe(200);
            expect(res.headers['set-cookie'][0]).toContain('token=;');
            expect(res.body.message).toBe('Logged out');
        });
    });

    describe('POST /api/auth/verify', () => {
        describe('should return 401', () => {
            it('if no token is in cookies', async () => {
                const res = await request(app).post('/api/auth/verify');

                expect(res.status).toBe(401);
                expect(res.body.message).toBe('Token not found');
            });

            it('if invalid token is in cookies', async () => {
                const res = await request(app).post('/api/auth/verify').set('Cookie', 'token=invalidToken');

                expect(res.status).toBe(401);
                expect(res.body.message).toBe('Invalid Token');
            });

            it('if user does not exist in database', async () => {
                const nonExistentUserId = 'non-existent-user-id';
                const token = generateTestToken(nonExistentUserId);
                const res = await request(app).post('/api/auth/verify').set('Cookie', `token=${token}`);

                expect(res.status).toBe(401);
                expect(res.body.message).toBe('Invalid User in Token');
            });
        });

        describe('should return 200', () => {
            it('if valid token is in cookies', async () => {
                const token = generateTestToken(testUserId);
                const res = await request(app).post('/api/auth/verify').set('Cookie', `token=${token}`);

                expect(res.status).toBe(200);
                expect(res.body.message).toBe('Authenticated');
            });
        });
    });
});
