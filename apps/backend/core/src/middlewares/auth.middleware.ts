import { injectable } from 'inversify';
import { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import ForbiddenError from 'chess-game-backend-common/errors/forbidden.error';
import { AuthUser } from 'chess-game-backend-common/models/user';
import env from 'chess-game-backend-common/config/env';

@injectable()
class AuthMiddleware {
    private readonly authServiceUrl = env.URLS.AUTH || 'http://localhost:8082';

    async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token: string | undefined = req.cookies.token || this.extractTokenFromHeader(req);

            if (!token) {
                throw new ForbiddenError('Authentication required');
            }

            const response = await axios.post(
                `${this.authServiceUrl}/internal/auth/verify`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            req.user = response.data.user as AuthUser;

            next();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                next(new ForbiddenError('Invalid or expired token'));
                return;
            }
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
