import { AuthUser } from 'chess-game-backend-common/models/user';

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
        interface User {
            id: string | undefined;
            name: string | undefined;
            email: string | undefined;
            elo: number | undefined;
            avatarUrl: string | null | undefined;
        }
    }
}
