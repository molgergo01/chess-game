import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import AuthService from '../services/auth.service';

@injectable()
class UserController {
    constructor(
        @inject(AuthService)
        private readonly authService: AuthService
    ) {}

    getMe(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.cookies.token as string | undefined;
            const user = this.authService.getUserFromToken(token);

            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }
}
export default UserController;
