jest.mock('socket.io-client');

import { initializeCoreSocket } from '@/lib/sockets/core.socket';
import { io, Socket } from 'socket.io-client';
import env from '@/lib/config/env';

jest.mock('@/lib/config/env');

describe('initializeCoreSocket', () => {
    let mockSocket: Partial<Socket>;

    beforeEach(() => {
        mockSocket = {
            id: 'mock-socket-id',
            connected: false,
            on: jest.fn(),
            emit: jest.fn(),
            off: jest.fn()
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
        const userId = 'user123';

        const result = initializeCoreSocket(userId);

        expect(result).toBe(mockSocket);
    });

    it('should call io with correct URL and auth parameters', () => {
        const userId = 'user123';

        initializeCoreSocket(userId);

        expect(io).toHaveBeenCalledWith('ws://localhost:8080', {
            reconnectionDelayMax: 10000,
            auth: {
                userId: userId
            }
        });
    });
});
