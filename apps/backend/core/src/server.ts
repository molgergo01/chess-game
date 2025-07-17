import app from './app';
import env from 'chess-game-backend-common/config/env';
import gameListener from './listeners/game.listener';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import corsConfig from 'chess-game-backend-common/config/cors';

const PORT = env.PORTS.CORE || 8080;
const server = createServer(app);
export const io = new Server(server, {
    connectionStateRecovery: {},
    cors: corsConfig
});

export const onConnection = (socket: Socket) => {
    const { getGameId, joinGame, movePiece, getPosition } = gameListener(
        io,
        socket
    );

    socket.on('getGameId', getGameId);
    socket.on('joinGame', joinGame);
    socket.on('movePiece', movePiece);
    socket.on('getPosition', getPosition);
};

io.on('connection', onConnection);

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
