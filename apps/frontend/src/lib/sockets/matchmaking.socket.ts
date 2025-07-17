'use client';

import env from '@/lib/config/env';
import { io, Socket } from 'socket.io-client';

let matchmaking_socket: Socket | undefined = undefined;

export function initializeMatchmakingSocket(userId: string) {
    const MATCHMAKING_SOCKET_SERVER_URL = env.WS_URLS.MATCHMAKING;

    matchmaking_socket = io(MATCHMAKING_SOCKET_SERVER_URL, {
        reconnectionDelayMax: 10000,
        auth: {
            userId: userId
        }
    });

    return matchmaking_socket;
}
