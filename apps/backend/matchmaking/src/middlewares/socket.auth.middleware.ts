import { injectable } from 'inversify';
import { Socket } from 'socket.io';
import axios from 'axios';
import { AuthUser } from 'chess-game-backend-common/models/user';

@injectable()
class SocketAuthMiddleware {
    private readonly authServiceUrl = process.env.AUTH_URL || 'http://localhost:8082';

    async authenticate(socket: Socket, next: (err?: Error) => void): Promise<void> {
        try {
            const token = socket.handshake.headers.cookie
                ?.split('; ')
                .find((row) => row.startsWith('token='))
                ?.split('=')[1];

            if (!token) {
                next(new Error('Authentication required'));
                return;
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

            socket.data.user = response.data.user as AuthUser;

            next();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                next(new Error('Invalid or expired token'));
                return;
            }
            next(error as Error);
        }
    }
}

export default SocketAuthMiddleware;
