import app from './app';
import env from 'chess-game-backend-common/config/env';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import corsConfig from 'chess-game-backend-common/config/cors';
import MatchmakingService from './services/matchmaking.service';
import container from './config/container';

const matchmakingService = container.get(MatchmakingService);

const PORT = env.PORTS.MATCHMAKING || 8082;
const server = createServer(app);
export const io = new Server(server, {
    connectionStateRecovery: {},
    cors: corsConfig
});

container.bind('SocketIO').toConstantValue(io);

export const onConnection = async (socket: Socket) => {
    await matchmakingService.setSocketIdForUser(socket.handshake.auth.userId, socket.id);
};

io.on('connection', onConnection);

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
