import app from './app';
import env from './config/env';
import gameListener from './listeners/game.listener';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';

const PORT = env.PORT || 8080;
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {}
});

const onConnection = (socket: Socket) => {
    const { movePiece } = gameListener(io, socket);

    console.log(`New connection on socket.io`);
    socket.on('message', (message) => {
        socket.emit('message', `I've received: ${message}`);
    });
    socket.on('movePiece', movePiece);
};

io.on('connection', onConnection);

server.listen(env.PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
