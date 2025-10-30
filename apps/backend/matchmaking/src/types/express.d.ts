import { AuthUser } from 'chess-game-backend-common/models/user';

declare global {
    namespace Express {
        interface Request {
            user: AuthUser;
        }
    }
}

export {};
