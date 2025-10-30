import { NextFunction, Response } from 'express';
import UserController from '../../src/controllers/user.controller';
import { AuthenticatedRequest } from 'chess-game-backend-common/types/authenticated.request';

describe('User controller', () => {
    let userController: UserController;

    beforeEach(() => {
        userController = new UserController();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    const next: NextFunction = jest.fn();

    describe('Get me', () => {
        const req = {
            user: {
                id: '1234',
                name: 'Test User',
                email: 'test@example.com',
                elo: 1200,
                avatarUrl: 'avatar.jpg'
            }
        } as Partial<AuthenticatedRequest>;
        it('should return the user with status 200', async () => {
            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.getMe(req as AuthenticatedRequest, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ user: req.user });
        });

        it('should call next function with error when error is thrown', async () => {
            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const expectedError = Error('Error');
            res.status = jest.fn().mockImplementation(() => {
                throw expectedError;
            });

            await userController.getMe(req as AuthenticatedRequest, res as Response, next);

            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
