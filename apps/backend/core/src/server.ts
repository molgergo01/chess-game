import app from './app';
import env from 'chess-game-backend-common/config/env';
import gameListener from './listeners/game.listener';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import corsConfig from 'chess-game-backend-common/config/cors';
import container from './config/container';
import TimerWatcher from './services/timer.watcher';
import SocketAuthMiddleware from './middlewares/socket.auth.middleware';
import chatListener from './listeners/chat.listener';

const timerWatcher = container.get(TimerWatcher);
const socketAuthMiddleware = container.get(SocketAuthMiddleware);

const PORT = env.PORTS.CORE || 8080;
const server = createServer(app);

export const io = new Server(server, {
    connectionStateRecovery: {},
    cors: corsConfig
});

container.bind('SocketIO').toConstantValue(io);

io.use(socketAuthMiddleware.authenticate.bind(socketAuthMiddleware));

export const onConnection = (socket: Socket) => {
    const { joinGame, movePiece, resign, offerDraw, respondDrawOffer } = gameListener(io, socket);
    const { joinChat, leaveChat, sendChatMessage } = chatListener(io, socket);

    socket.on('joinGame', joinGame);
    socket.on('movePiece', movePiece);
    socket.on('resign-game', resign);
    socket.on('offer-draw', offerDraw);
    socket.on('respond-draw-offer', respondDrawOffer);

    socket.on('join-chat', joinChat);
    socket.on('leave-chat', leaveChat);
    socket.on('send-chat-message', sendChatMessage);
};

io.on('connection', onConnection);
timerWatcher.start();

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
