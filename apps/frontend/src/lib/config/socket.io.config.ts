import { io } from 'socket.io-client';

const SOCKET_SERVER_URL =
    process.env.SOCKET_SERVER_URL || 'ws://localhost:8080';
export const socket = io(SOCKET_SERVER_URL, {
    reconnectionDelayMax: 10000
});
