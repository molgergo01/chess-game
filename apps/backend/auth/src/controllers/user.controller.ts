import { NextFunction, Response } from 'express';
import { injectable } from 'inversify';
import { GetMeResponse } from '../models/response';
import { AuthenticatedRequest } from 'chess-game-backend-common/types/authenticated.request';

@injectable()
class UserController {
    async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const response: GetMeResponse = {
                user: req.user!
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }
}
export default UserController;
