import { NextFunction, Request, Response } from 'express';
import UserController from '../../src/controllers/user.controller';
import AuthService from '../../src/services/auth.service';

jest.mock('../../src/services/auth.service');

describe('User controller', () => {
    let userController: UserController;
    let mockAuthService: jest.Mocked<AuthService>;

    beforeEach(() => {
        mockAuthService = new AuthService(
            null as never
        ) as jest.Mocked<AuthService>;
        mockAuthService.getUserFromToken = jest.fn();

        userController = new UserController(mockAuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    const next: NextFunction = jest.fn();

    describe('Get me', () => {
        const req = {
            cookies: {
                token: 'token'
            }
        } as Partial<Request>;
        it('should return the user with status 200', () => {
            const res: Partial<jest.Mocked<Response>> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const user = 'user';
            mockAuthService.getUserFromToken.mockReturnValue(user);

            userController.getMe(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(user);
        });

        it('should call next function with error when error is thrown', () => {
            const res: Partial<jest.Mocked<Response>> = {};

            const expectedError = Error('Error');
            mockAuthService.getUserFromToken.mockImplementation(() => {
                throw expectedError;
            });

            userController.getMe(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
