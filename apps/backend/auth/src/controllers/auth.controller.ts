import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import env from 'chess-game-backend-common/src/config/env';
import AuthService from '../services/auth.service';

@injectable()
class AuthController {
    constructor(
        @inject(AuthService)
        private readonly authService: AuthService
    ) {}

    async loginUser(req: Request, res: Response, next: NextFunction) {
        try {
            const token = await this.authService.login(req.user);

            res.status(200)
                .cookie('token', token, {
                    domain: 'localhost',
                    path: '/',
                    httpOnly: true,
                    sameSite: 'lax'
                })
                .redirect(`${env.FRONTEND_URL}`);
        } catch (error) {
            next(error);
        }
    }

    logoutUser(req: Request, res: Response, next: NextFunction) {
        try {
            res.status(200)
                .clearCookie('token', {
                    domain: 'localhost',
                    path: '/',
                    httpOnly: true,
                    sameSite: 'lax'
                })
                .json({ message: 'Logged out' });
        } catch (error) {
            next(error);
        }
    }

    verifyToken(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.cookies.token as string | undefined;
            this.authService.getUserFromToken(token);

            res.status(200).json({
                message: 'Authenticated'
            });
        } catch (error) {
            next(error);
        }
    }
}

export default AuthController;
