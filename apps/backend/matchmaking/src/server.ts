import app from './app';
import env from 'chess-game-backend-common/config/env';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import MatchmakingService from './services/matchmaking.service';
import container from './config/container';
import SocketAuthMiddleware from './middlewares/socket.auth.middleware';
import corsConfig from 'chess-game-backend-common/config/cors';

const matchmakingService = container.get(MatchmakingService);
const socketAuthMiddleware = container.get(SocketAuthMiddleware);

const PORT = env.PORTS.MATCHMAKING || 8082;
const server = createServer(app);
export const io = new Server(server, {
    path: '/api/matchmaking/socket.io',
    cors: corsConfig,
    allowEIO3: true,
    transports: ['polling', 'websocket'],
    cookie: {
        name: 'io',
        path: '/api/matchmaking/socket.io',
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    }
});

container.bind('SocketIO').toConstantValue(io);

io.use(socketAuthMiddleware.authenticate.bind(socketAuthMiddleware));

export const onConnection = async (socket: Socket) => {
    await matchmakingService.setSocketIdForUser(socket.data.user!.id, socket.id);
};

io.on('connection', onConnection);

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
