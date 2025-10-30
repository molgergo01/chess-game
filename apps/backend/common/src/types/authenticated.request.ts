import { Request } from 'express';
import { AuthUser } from '../models/user';

export interface AuthenticatedRequest<
    P = unknown,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = unknown,
    Locals extends Record<string, unknown> = Record<string, unknown>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
    user: AuthUser;
}
