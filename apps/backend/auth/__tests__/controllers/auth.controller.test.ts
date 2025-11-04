import { NextFunction, Request, Response } from 'express';
import AuthService from '../../src/services/auth.service';
import AuthController from '../../src/controllers/auth.controller';
import { AuthenticatedRequest } from 'chess-game-backend-common/types/authenticated.request';

jest.mock('chess-game-backend-common/config/env', () => ({
    __esModule: true,
    default: {
        FRONTEND_URL: 'localhost:3000',
        URLS: {
            CORE: 'http://localhost:8080',
            MATCHMAKING: 'http://localhost:8081',
            AUTH: 'http://localhost:8082'
        }
    }
}));

jest.mock('../../src/services/auth.service');

describe('Auth Controller', () => {
    let authController: AuthController;
    let mockAuthService: jest.Mocked<AuthService>;

    beforeEach(() => {
        mockAuthService = new AuthService(null as never) as jest.Mocked<AuthService>;
        mockAuthService.login = jest.fn();
        mockAuthService.getUserFromToken = jest.fn();

        authController = new AuthController(mockAuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    const next: NextFunction = jest.fn();

    describe('Login User', () => {
        const req = {} as Partial<Request>;
        it('should return token in cookie with status 200 and redirect', async () => {
            const res: Partial<jest.Mocked<Response>> = {
                cookie: jest.fn().mockReturnThis(),
                status: jest.fn().mockReturnThis(),
                redirect: jest.fn()
            };
            mockAuthService.login.mockResolvedValue('tokenValue');

            await authController.loginUser(req as Request, res as Response, next as NextFunction);
            expect(res.cookie).toHaveBeenCalledWith('token', 'tokenValue', {
                httpOnly: true,
                sameSite: 'none',
                secure: true
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.redirect).toHaveBeenCalledWith('localhost:3000');
        });

        it('should call next function with error when error is thrown', async () => {
            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
                redirect: jest.fn()
            };

            const expectedError = new Error('Failed to make call to DB.');

            mockAuthService.login.mockRejectedValue(expectedError);

            await authController.loginUser(req as Request, res as Response, next as NextFunction);

            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });

    describe('Logout User', () => {
        it('should clear token from cookies and return status 200', () => {
            const req = {
                user: {
                    id: '1234',
                    name: 'Test User',
                    email: 'test@example.com',
                    elo: 1200,
                    avatarUrl: 'avatar.jpg'
                }
            } as Partial<AuthenticatedRequest>;
            const res: Partial<jest.Mocked<Response>> = {
                clearCookie: jest.fn().mockReturnThis(),
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            authController.logoutUser(req as AuthenticatedRequest, res as Response, next as NextFunction);

            expect(res.clearCookie).toHaveBeenCalledWith('token', {
                httpOnly: true,
                sameSite: 'none',
                secure: true
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Logged out' });
        });
    });

    describe('Verify Token', () => {
        it('should return status 200 and authenticated when token is valid', async () => {
            const req = {
                cookies: {
                    token: 'validToken'
                }
            } as Partial<Request>;

            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await authController.verifyToken(req as Request, res as Response, next as NextFunction);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should call next function with error when error is thrown', async () => {
            const req = {
                cookies: {}
            } as Partial<Request>;

            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const expectedError = new Error('Unauthorized');

            mockAuthService.getUserFromToken.mockRejectedValue(expectedError);

            await authController.verifyToken(req as Request, res as Response, next as NextFunction);
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
