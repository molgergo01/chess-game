import { AuthUser } from '@/lib/models/response/auth';
import { getUser } from '@/lib/clients/auth.rest.client';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import env from '@/lib/config/env';

jest.mock('axios');

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
            const authUser: AuthUser = {
                id: 'user123',
                name: 'Test User',
                email: 'test@user.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            };
            const mockResponse = {
                status: 200,
                data: { user: authUser }
            };

            (axios.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await getUser();

            expect(axios.get).toHaveBeenCalledWith('http://localhost:8082/api/user/me', {
                withCredentials: true
            });
            expect(result).toBe(authUser);
        });

        it('should throw error with message from response when AxiosError has response', async () => {
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: { message: 'User not found' },
                status: 404,
                statusText: 'Not Found',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            await expect(getUser()).rejects.toThrow('User not found');
        });

        it('should throw default error message when AxiosError has response without message', async () => {
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: {},
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            await expect(getUser()).rejects.toThrow('Failed to get user');
        });

        it('should throw network error when AxiosError has request but no response', async () => {
            const axiosError = new AxiosError('Network Error');
            axiosError.request = {};

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            await expect(getUser()).rejects.toThrow('Network error: Unable to connect to core service');
        });

        it('should throw generic error for non-AxiosError', async () => {
            (axios.get as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await expect(getUser()).rejects.toThrow('Failed to get user');
        });
    });
});
