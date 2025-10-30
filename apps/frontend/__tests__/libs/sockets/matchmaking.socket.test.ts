jest.mock('socket.io-client');

import { disconnectMatchmakingSocket, initializeMatchmakingSocket } from '@/lib/sockets/matchmaking.socket';
import { io, Socket } from 'socket.io-client';
import env from '@/lib/config/env';

jest.mock('@/lib/config/env');

describe('initializeMatchmakingSocket', () => {
    let mockSocket: Partial<Socket>;

    beforeEach(() => {
        mockSocket = {
            id: 'mock-socket-id',
            connected: false,
            on: jest.fn(),
            emit: jest.fn(),
            off: jest.fn(),
            disconnect: jest.fn()
        };

        (io as jest.Mock).mockReturnValue(mockSocket);

        env.WS_URLS = {
            CORE: 'ws://localhost:8080',
            MATCHMAKING: 'ws://localhost:8081'
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return a socket client', () => {
        const result = initializeMatchmakingSocket();

        expect(result).toBe(mockSocket);
        expect(io).toHaveBeenCalledWith('ws://localhost:8081', {
            reconnectionDelayMax: 10000,
            withCredentials: true
        });
    });

    it('should disconnect socket client', () => {
        initializeMatchmakingSocket();
        disconnectMatchmakingSocket();

        expect(mockSocket.disconnect).toHaveBeenCalled();
    });
});
