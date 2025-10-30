import env from '@/lib/config/env';
import { io, Socket } from 'socket.io-client';

let core_socket: Socket | undefined = undefined;

export function initializeCoreSocket() {
    if (core_socket?.connected) {
        return core_socket;
    }

    if (core_socket) {
        core_socket.disconnect();
    }

    const CORE_SOCKET_SERVER_URL = env.WS_URLS.CORE;

    core_socket = io(CORE_SOCKET_SERVER_URL, {
        reconnectionDelayMax: 10000,
        withCredentials: true
    });

    return core_socket;
}

export function disconnectCoreSocket() {
    if (core_socket) {
        core_socket.disconnect();
        core_socket = undefined;
    }
}
