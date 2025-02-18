import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';

jest.mock('../../src/config/env', () => ({
    __esModule: true,
    default: {
        GOOGLE_CLIENT_ID: 'mocked_google_client_id',
        GOOGLE_CLIENT_SECRET: 'mocked_google_client_secret',
        JWT_SECRET: 'mocked_jwt_secret'
    }
}));

describe('GET api/auth/google', () => {
    test('should redirect to google', async () => {
        const res = await request(app).get('/api/auth/google');

        expect(res.status).toBe(302);
        expect(res.headers['location']).toContain(
            'https://accounts.google.com'
        );
    });
});

describe('GET api/auth/google/callback', () => {
    test('should login user', async () => {
        //TODO Mock passport.authenticate
    });
});

describe('POST /api/auth/google', () => {
    test('should clear cookies', async () => {
        const res = await request(app).post('/api/auth/logout');

        expect(res.status).toBe(200);
        expect(res.headers['set-cookie'][0]).toContain('token=;');
    });
});

describe('POST api/auth/google', () => {
    describe('should return 401', () => {
        test('if no token is in cookies', async () => {
            const res = await request(app).post('/api/auth/verify');

            expect(res.status).toBe(401);
            expect(JSON.stringify(res.body)).toBe(
                JSON.stringify({ message: 'Unauthorized' })
            );
        });
        test('if invalid token is in cookies', async () => {
            const res = await request(app)
                .post('/api/auth/verify')
                .set('Cookie', 'token=invalidToken');

            expect(res.status).toBe(401);
            expect(JSON.stringify(res.body)).toBe(
                JSON.stringify({ message: 'Invalid token' })
            );
        });
    });
    describe('should return 200', () => {
        test('if valid token is in cookies', async () => {
            const token = jwt.sign('user', 'mocked_jwt_secret');
            const res = await request(app)
                .post('/api/auth/verify')
                .set('Cookie', `token=${token}`);

            expect(res.status).toBe(200);
            expect(JSON.stringify(res.body)).toBe(
                JSON.stringify({ message: 'Authenticated', user: 'user' })
            );
        });
    });
});
