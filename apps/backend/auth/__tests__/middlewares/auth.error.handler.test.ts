import { NextFunction, Request, Response } from 'express';
import { authErrorHandler } from '../../src/middlewares/auth.error.handler';
import FailedLoginError from '../../src/errors/failed.login.error';

jest.mock('chess-game-backend-common/config/env', () => ({
    __esModule: true,
    default: {
        FRONTEND_URL: 'localhost:3000'
    }
}));

describe('Auth Error Handler', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    it('should call next when error is unknown', () => {
        const res: Partial<jest.Mocked<Response>> = {};

        const error = new Error();

        authErrorHandler(error, req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    const req: Partial<jest.Mocked<Request>> = {};
    const next: NextFunction = jest.fn();

    it('should return 401 with error message and redirect to login page when error is FailedLoginError', () => {
        const res: Partial<jest.Mocked<Response>> = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            redirect: jest.fn()
        };

        const error = new FailedLoginError('Error');
        authErrorHandler(error, req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: error.message });
        expect(res.redirect).toHaveBeenCalledWith(
            'localhost:3000/login?failedLogin'
        );

        expect(next).toHaveBeenCalledTimes(0);
    });
});
