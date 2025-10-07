// src/middleware/errorHandler.ts
import { NextFunction, Request, Response } from 'express';
import FailedLoginError from '../errors/failed.login.error';
import env from 'chess-game-backend-common/config/env';

export function authErrorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
    if (err instanceof FailedLoginError) {
        res.status(401).json({ message: err.message }).redirect(`${env.FRONTEND_URL}/login?failedLogin`);
        return;
    }

    next(err);
}
