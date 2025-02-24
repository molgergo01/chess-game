import { Request, Response } from 'express';
import {
    loginUser,
    logoutUser,
    verifyToken
} from '../../src/controllers/auth.controller';
import * as user_repository from '../../src/repositories/user.repository';

jest.mock('../../src/config/env', () => ({
    __esModule: true,
    default: {
        JWT_SECRET: 'mocked_jwt_secret',
        FRONTEND_URL: 'localhost:3000'
    }
}));

jest.mock('../../src/repositories/user.repository', () => ({
    createUserIfNotExists: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'tokenValue'),
    verify: jest.fn((token: string) => {
        if (token === 'invalidToken') throw 'Invalid token';
    })
}));

describe('Login User', () => {
    const req = {
        user: {
            id: 'id',
            name: 'name',
            email: 'email@email.com'
        }
    } as Partial<Request>;
    test('should return token in cookie with status 200 and redirect', async () => {
        const res: Partial<jest.Mocked<Response>> = {
            cookie: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            redirect: jest.fn()
        };

        await loginUser(req as Request, res as Response);
        expect(res.cookie).toHaveBeenCalledWith('token', 'tokenValue', {
            httpOnly: true,
            sameSite: 'lax'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.redirect).toHaveBeenCalledWith('localhost:3000');
    });

    test('should return status 500 and redirect if db call throws error', async () => {
        const res: Partial<jest.Mocked<Response>> = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            redirect: jest.fn()
        };

        const expectedError = new Error('Failed to make call to DB.');

        (
            user_repository.createUserIfNotExists as jest.Mock
        ).mockRejectedValueOnce(expectedError);

        await loginUser(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.redirect).toHaveBeenCalledWith(
            'localhost:3000/login?failedLogin'
        );
    });
});

describe('Logout User', () => {
    test('should clear token from cookies and return status 200', () => {
        const req = {} as Partial<Request>;
        const res: Partial<jest.Mocked<Response>> = {
            clearCookie: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        logoutUser(req as Request, res as Response);

        expect(res.clearCookie).toHaveBeenCalledWith('token', {
            httpOnly: true,
            sameSite: 'lax'
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Logged out' });
    });
});

describe('Verify Token', () => {
    test('should return status 200 and authenticated when token is valid', () => {
        const req = {
            cookies: {
                token: 'validToken'
            }
        } as Partial<Request>;

        const res: Partial<jest.Mocked<Response>> = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        verifyToken(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    describe('should return status 401 and unathorized', () => {
        test('when token is not in cookies', () => {
            const req = {
                cookies: {}
            } as Partial<Request>;

            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            verifyToken(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Unauthorized'
            });
        });

        test('when token is invalid', () => {
            const req = {
                cookies: {
                    token: 'invalidToken'
                }
            } as Partial<Request>;

            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            verifyToken(req as Request, res as Response);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid token'
            });
        });
    });
});
