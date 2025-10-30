'use client';

import env from '@/lib/config/env';
import { io, Socket } from 'socket.io-client';

let matchmaking_socket: Socket | undefined = undefined;

export function initializeMatchmakingSocket() {
    if (matchmaking_socket?.connected) {
        return matchmaking_socket;
    }

    if (matchmaking_socket) {
        matchmaking_socket.disconnect();
    }

    const MATCHMAKING_SOCKET_SERVER_URL = env.WS_URLS.MATCHMAKING;

    matchmaking_socket = io(MATCHMAKING_SOCKET_SERVER_URL, {
        reconnectionDelayMax: 10000,
        withCredentials: true
    });

    return matchmaking_socket;
}

export function disconnectMatchmakingSocket() {
    if (matchmaking_socket) {
        matchmaking_socket.disconnect();
        matchmaking_socket = undefined;
    }
}
