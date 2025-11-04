import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import env from 'chess-game-backend-common/config/env';
import AuthService from '../services/auth.service';
import { AuthenticatedRequest } from 'chess-game-backend-common/types/authenticated.request';

@injectable()
class AuthController {
    constructor(
        @inject(AuthService)
        private readonly authService: AuthService
    ) {}

    async loginUser(req: Request<unknown, unknown, unknown>, res: Response, next: NextFunction) {
        try {
            const token = await this.authService.login(req.user);

            res.status(200)
                .cookie('token', token, {
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true
                })
                .redirect(`${env.FRONTEND_URL}`);
        } catch (error) {
            next(error);
        }
    }

    logoutUser(req: AuthenticatedRequest<unknown, unknown, unknown>, res: Response, next: NextFunction) {
        try {
            res.status(200)
                .clearCookie('token', {
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true
                })
                .json({ message: 'Logged out' });
        } catch (error) {
            next(error);
        }
    }

    async verifyToken(req: Request<unknown, unknown, unknown>, res: Response, next: NextFunction) {
        try {
            const token = req.cookies.token as string | undefined;
            await this.authService.getUserFromToken(token);

            res.status(200).json({
                message: 'Authenticated'
            });
        } catch (error) {
            next(error);
        }
    }
}

export default AuthController;
