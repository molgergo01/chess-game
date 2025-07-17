import env from '@/lib/config/env';
import { io, Socket } from 'socket.io-client';

let core_socket: Socket | undefined = undefined;

export function initializeCoreSocket(userId: string) {
    const CORE_SOCKET_SERVER_URL = env.WS_URLS.CORE;

    core_socket = io(CORE_SOCKET_SERVER_URL, {
        reconnectionDelayMax: 10000,
        auth: {
            userId: userId
        }
    });

    return core_socket;
}
