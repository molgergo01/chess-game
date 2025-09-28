jest.mock('axios');

import { joinQueue, leaveQueue, isInQueue } from '@/lib/clients/matchmaking.rest.client';
import axios from 'axios';
import env from '@/lib/config/env';

jest.mock('@/lib/config/env');

describe('matchmaking.rest.client', () => {
    beforeEach(() => {
        env.REST_URLS = {
            CORE: 'http://localhost:8080',
            MATCHMAKING: 'http://localhost:8081',
            AUTH: 'http://localhost:8082'
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('joinQueue', () => {
        it('should call axios.post with correct URL and request body', async () => {
            const userId = 'user123';
            const mockResponse = { data: { success: true } };

            (axios.post as jest.Mock).mockResolvedValue(mockResponse);

            const result = await joinQueue(userId);

            expect(axios.post).toHaveBeenCalledWith(
                'http://localhost:8081/api/matchmaking/queue',
                { userId: userId }
            );
            expect(result).toBe(mockResponse);
        });
    });

    describe('leaveQueue', () => {
        it('should call axios.delete with correct URL', async () => {
            const userId = 'user123';
            const mockResponse = { data: { success: true } };

            (axios.delete as jest.Mock).mockResolvedValue(mockResponse);

            const result = await leaveQueue(userId);

            expect(axios.delete).toHaveBeenCalledWith(
                'http://localhost:8081/api/matchmaking/queue/user123'
            );
            expect(result).toBe(mockResponse);
        });
    });

    describe('isInQueue', () => {
        it('should return true when status is 200', async () => {
            const userId = 'user123';
            const mockResponse = { status: 200 };

            (axios.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await isInQueue(userId);

            expect(axios.get).toHaveBeenCalledWith(
                'http://localhost:8081/api/matchmaking/queue/user123',
                {
                    validateStatus: expect.any(Function)
                }
            );
            expect(result).toBe(true);
        });

        it('should return false when status is 404', async () => {
            const userId = 'user123';
            const mockResponse = { status: 404 };

            (axios.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await isInQueue(userId);

            expect(result).toBe(false);
        });
    });
});
