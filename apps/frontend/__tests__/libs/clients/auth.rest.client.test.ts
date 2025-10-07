jest.mock('axios');

import { getUser } from '@/lib/clients/auth.rest.client';
import axios from 'axios';
import env from '@/lib/config/env';

jest.mock('@/lib/config/env');

describe('auth.rest.client', () => {
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

    describe('getUser', () => {
        it('should call axios.get with correct URL and options', async () => {
            const mockResponse = {
                status: 200,
                data: { id: 'user123', name: 'Test User' }
            };

            (axios.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await getUser();

            expect(axios.get).toHaveBeenCalledWith('http://localhost:8082/api/user/me', {
                withCredentials: true,
                validateStatus: expect.any(Function)
            });
            expect(result).toBe(mockResponse);
        });
    });
});
