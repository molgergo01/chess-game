import { NextFunction, Request, Response } from 'express';
import AuthService from '../../src/services/auth.service';
import AuthMiddleware from '../../src/middlewares/auth.middleware';
import ForbiddenError from 'chess-game-backend-common/errors/forbidden.error';

jest.mock('../../src/services/auth.service');

describe('Auth Middleware', () => {
    let authMiddleware: AuthMiddleware;
    let mockAuthService: jest.Mocked<AuthService>;
    let req: Partial<jest.Mocked<Request>>;
    let res: Partial<jest.Mocked<Response>>;
    let next: NextFunction;

    beforeEach(() => {
        mockAuthService = new AuthService(null as never) as jest.Mocked<AuthService>;
        mockAuthService.getUserFromToken = jest.fn();

        authMiddleware = new AuthMiddleware(mockAuthService);

        req = {
            cookies: {},
            headers: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();
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
            mockAuthService.getUserFromToken.mockResolvedValue(user);

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith(token);
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
            mockAuthService.getUserFromToken.mockResolvedValue(user);

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith(token);
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
            mockAuthService.getUserFromToken.mockResolvedValue(user);

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith(cookieToken);
            expect(req.user).toEqual(user);
            expect(next).toHaveBeenCalledWith();
        });

        it('should call next with ForbiddenError when no token provided', async () => {
            req.cookies = {};
            req.headers = {};

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockAuthService.getUserFromToken).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
            expect((next as jest.Mock).mock.calls[0][0].message).toBe('Authentication required');
        });

        it('should call next with ForbiddenError when Authorization header is malformed', async () => {
            req.headers = { authorization: 'InvalidFormat token' };

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockAuthService.getUserFromToken).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
        });

        it('should call next with error when getUserFromToken throws', async () => {
            const token = 'invalid-token';
            const error = new Error('Invalid token');

            req.cookies = { token };
            mockAuthService.getUserFromToken.mockRejectedValue(error);

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith(token);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('should call next with error when getUserFromToken throws ForbiddenError', async () => {
            const token = 'expired-token';
            const error = new ForbiddenError('Token expired');

            req.cookies = { token };
            mockAuthService.getUserFromToken.mockRejectedValue(error);

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith(token);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('should not call next with success when authentication fails', async () => {
            const token = 'invalid-token';
            const error = new Error('Invalid token');

            req.cookies = { token };
            mockAuthService.getUserFromToken.mockRejectedValue(error);

            await authMiddleware.authenticate(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith(error);
            expect(next).not.toHaveBeenCalledWith();
        });
    });
});
