import { NextFunction, Request, Response } from 'express';
import AuthService from '../../src/services/auth.service';
import InternalAuthController from '../../src/controllers/internal.auth.controller';
import UnauthorizedError from 'chess-game-backend-common/errors/unauthorized.error';

jest.mock('../../src/services/auth.service');

describe('Internal Auth Controller', () => {
    let internalAuthController: InternalAuthController;
    let mockAuthService: jest.Mocked<AuthService>;

    beforeEach(() => {
        mockAuthService = new AuthService(null as never) as jest.Mocked<AuthService>;
        mockAuthService.getUserFromToken = jest.fn();

        internalAuthController = new InternalAuthController(mockAuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    const next: NextFunction = jest.fn();

    describe('Verify Token', () => {
        const mockUser = {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            avatarUrl: 'https://example.com/avatar.jpg',
            elo: 1500
        };

        it('should return user with status 200 when valid Bearer token provided', async () => {
            const req = {
                headers: {
                    authorization: 'Bearer validToken'
                }
            } as Partial<Request>;

            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            mockAuthService.getUserFromToken.mockResolvedValue(mockUser);

            await internalAuthController.verifyToken(req as Request, res as Response, next as NextFunction);

            expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith('validToken');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ user: mockUser });
        });

        it('should return user with status 200 when valid token without Bearer prefix', async () => {
            const req = {
                headers: {
                    authorization: 'validToken'
                }
            } as Partial<Request>;

            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            mockAuthService.getUserFromToken.mockResolvedValue(mockUser);

            await internalAuthController.verifyToken(req as Request, res as Response, next as NextFunction);

            expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith('validToken');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ user: mockUser });
        });

        it('should return 403 when Authorization header is missing', async () => {
            const req = {
                headers: {}
            } as Partial<Request>;

            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await internalAuthController.verifyToken(req as Request, res as Response, next as NextFunction);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Authorization token is required' });
            expect(mockAuthService.getUserFromToken).not.toHaveBeenCalled();
        });

        it('should return 403 when token is empty string', async () => {
            const req = {
                headers: {
                    authorization: ''
                }
            } as Partial<Request>;

            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await internalAuthController.verifyToken(req as Request, res as Response, next as NextFunction);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Authorization token is required' });
            expect(mockAuthService.getUserFromToken).not.toHaveBeenCalled();
        });

        it('should call next with error when getUserFromToken throws UnauthorizedError', async () => {
            const req = {
                headers: {
                    authorization: 'Bearer invalidToken'
                }
            } as Partial<Request>;

            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const expectedError = new UnauthorizedError('Invalid Token');
            mockAuthService.getUserFromToken.mockRejectedValue(expectedError);

            await internalAuthController.verifyToken(req as Request, res as Response, next as NextFunction);

            expect(next).toHaveBeenCalledWith(expectedError);
        });

        it('should call next with error when user is not found', async () => {
            const req = {
                headers: {
                    authorization: 'Bearer validToken'
                }
            } as Partial<Request>;

            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const expectedError = new UnauthorizedError('Invalid User in Token');
            mockAuthService.getUserFromToken.mockRejectedValue(expectedError);

            await internalAuthController.verifyToken(req as Request, res as Response, next as NextFunction);

            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
