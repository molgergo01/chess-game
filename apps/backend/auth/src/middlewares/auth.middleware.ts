import { inject, injectable } from 'inversify';
import { NextFunction, Request, Response } from 'express';
import ForbiddenError from 'chess-game-backend-common/errors/forbidden.error';
import AuthService from '../services/auth.service';

@injectable()
class AuthMiddleware {
    constructor(
        @inject(AuthService)
        private readonly authService: AuthService
    ) {}

    async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token: string | undefined = req.cookies.token || this.extractTokenFromHeader(req);

            if (!token) {
                throw new ForbiddenError('Authentication required');
            }

            req.user = await this.authService.getUserFromToken(token);

            next();
        } catch (error) {
            next(error);
        }
    }

    private extractTokenFromHeader(req: Request): string | undefined {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return undefined;
        }

        return authHeader.substring(7);
    }
}

export default AuthMiddleware;
