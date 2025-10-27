import 'express';

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
        interface User {
            id: string | undefined;
            name: string | undefined;
            email: string | undefined;
            avatarUrl: string | undefined;
        }
    }
}
