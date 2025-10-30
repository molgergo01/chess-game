import { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import AuthMiddleware from '../../src/middlewares/auth.middleware';
import ForbiddenError from 'chess-game-backend-common/errors/forbidden.error';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth Middleware', () => {
    let authMiddleware: AuthMiddleware;
    let req: Partial<jest.Mocked<Request>>;
    let res: Partial<jest.Mocked<Response>>;
    let next: NextFunction;

    beforeEach(() => {
        authMiddleware = new AuthMiddleware();

        req = {
            cookies: {},
            headers: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();

        process.env.AUTH_SERVICE_URL = 'http://localhost:8082';
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('authenticate', () => {
        it('should authenticate user with token from cookies', async () => {
            const token = 'valid-token';
            const user = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                avatarUrl: 'http://example.com/avatar.jpg',
                elo: 1200
            };

            req.cookies = { token };
            mockedAxios.post.mockResolvedValue({ data: { user } });

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            expect(req.user).toEqual(user);
            expect(next).toHaveBeenCalledWith();
        });

        it('should authenticate user with token from Authorization header', async () => {
            const token = 'valid-token';
            const user = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                avatarUrl: 'http://example.com/avatar.jpg',
                elo: 1200
            };

            req.headers = { authorization: `Bearer ${token}` };
            mockedAxios.post.mockResolvedValue({ data: { user } });

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            expect(req.user).toEqual(user);
            expect(next).toHaveBeenCalledWith();
        });

        it('should prefer cookie token over Authorization header', async () => {
            const cookieToken = 'cookie-token';
            const headerToken = 'header-token';
            const user = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                avatarUrl: 'http://example.com/avatar.jpg',
                elo: 1200
            };

            req.cookies = { token: cookieToken };
            req.headers = { authorization: `Bearer ${headerToken}` };
            mockedAxios.post.mockResolvedValue({ data: { user } });

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${cookieToken}`
                    }
                }
            );
            expect(req.user).toEqual(user);
            expect(next).toHaveBeenCalledWith();
        });

        it('should call next with ForbiddenError when no token provided', async () => {
            req.cookies = {};
            req.headers = {};

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockedAxios.post).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
            expect((next as jest.Mock).mock.calls[0][0].message).toBe('Authentication required');
        });

        it('should call next with ForbiddenError when Authorization header is malformed', async () => {
            req.headers = { authorization: 'InvalidFormat token' };

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockedAxios.post).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
        });

        it('should call next with ForbiddenError when axios returns error response', async () => {
            const token = 'invalid-token';
            const error = {
                isAxiosError: true,
                response: {
                    status: 401,
                    data: { message: 'Invalid token' }
                }
            };

            req.cookies = { token };
            mockedAxios.post.mockRejectedValue(error);
            mockedAxios.isAxiosError.mockReturnValue(true);

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
            expect((next as jest.Mock).mock.calls[0][0].message).toBe('Invalid or expired token');
        });

        it('should call next with original error when axios error has no response', async () => {
            const token = 'valid-token';
            const error = new Error('Network error');

            req.cookies = { token };
            mockedAxios.post.mockRejectedValue(error);
            mockedAxios.isAxiosError.mockReturnValue(false);

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            expect(next).toHaveBeenCalledWith(error);
        });

        it('should call next with original error when error is not axios error', async () => {
            const token = 'valid-token';
            const error = new Error('Unexpected error');

            req.cookies = { token };
            mockedAxios.post.mockRejectedValue(error);
            mockedAxios.isAxiosError.mockReturnValue(false);

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });

        it('should use default auth service URL when env variable is not set', async () => {
            delete process.env.AUTH_SERVICE_URL;

            const token = 'valid-token';
            const user = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                avatarUrl: 'http://example.com/avatar.jpg',
                elo: 1200
            };

            authMiddleware = new AuthMiddleware();

            req.cookies = { token };
            mockedAxios.post.mockResolvedValue({ data: { user } });

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        });
    });
});
