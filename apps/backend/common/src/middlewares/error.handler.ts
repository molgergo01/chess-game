// src/middleware/errorHandler.ts
import { NextFunction, Request, Response } from 'express';
import BadRequestError from '../errors/bad.request.error';
import NotFoundError from '../errors/not.found.error';
import ConflictError from '../errors/conflict.error';
import InternalServerError from '../errors/internal.server.error';
import UnauthorizedError from '../errors/unauthorized.error';
import ForbiddenError from '../errors/forbidden.error';

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
): void {
    if (err instanceof BadRequestError) {
        res.status(400).json({ message: err.message });
        return;
    }

    if (err instanceof UnauthorizedError) {
        res.status(401).json({ message: err.message });
        return;
    }

    if (err instanceof ForbiddenError) {
        res.status(403).json({ message: err.message });
    }

    if (err instanceof NotFoundError) {
        res.status(404).json({ message: err.message });
        return;
    }

    if (err instanceof ConflictError) {
        res.status(409).json({ message: err.message });
        return;
    }

    if (err instanceof InternalServerError) {
        res.status(500).json({ message: err.message });
        return;
    }

    // Default 500
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
}
