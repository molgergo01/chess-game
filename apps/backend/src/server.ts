import app from './app';
import env from './config/env';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';

const PORT = env.PORT || 8080;
const server = createServer(app);

const io = new Server(server, {
    connectionStateRecovery: {}
});

const onConnection = (socket: Socket) => {
    console.log(`New connection on socket.io`);
    socket.on('message', (message) => {
        socket.emit('message', `I've received: ${message}`);
    });
};

io.on('connection', onConnection);

server.listen(env.PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
