import AuthService from '../services/auth.service';
import { inject, injectable } from 'inversify';
import { NextFunction, Request, Response } from 'express';
import { GetMeResponse } from '../models/response';

@injectable()
class InternalAuthController {
    constructor(
        @inject(AuthService)
        private readonly authService: AuthService
    ) {}

    async verifyToken(req: Request<unknown, unknown, unknown>, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

            if (!token) {
                res.status(403).json({ message: 'Authorization token is required' });
                return;
            }

            const user = await this.authService.getUserFromToken(token);
            const response: GetMeResponse = {
                user: user
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }
}

export default InternalAuthController;
