jest.mock('axios');

import {
    createPrivateQueue,
    getQueueStatus,
    joinPrivateQueue,
    joinQueue,
    leavePrivateQueue,
    leaveQueue
} from '@/lib/clients/matchmaking.rest.client';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
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

            (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });

            await joinQueue(userId);

            expect(axios.post).toHaveBeenCalledWith('http://localhost:8081/api/matchmaking/queue', { userId: userId });
        });

        it('should throw error with message from response when AxiosError has response', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: { message: 'User already in queue' },
                status: 400,
                statusText: 'Bad Request',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.post as jest.Mock).mockRejectedValue(axiosError);

            await expect(joinQueue(userId)).rejects.toThrow('User already in queue');
        });

        it('should throw default error message when AxiosError has response without message', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: {},
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.post as jest.Mock).mockRejectedValue(axiosError);

            await expect(joinQueue(userId)).rejects.toThrow('Failed to join queue');
        });

        it('should throw network error when AxiosError has request but no response', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Network Error');
            axiosError.request = {};

            (axios.post as jest.Mock).mockRejectedValue(axiosError);

            await expect(joinQueue(userId)).rejects.toThrow('Network error: Unable to connect to matchmaking service');
        });

        it('should throw generic error for non-AxiosError', async () => {
            const userId = 'user123';

            (axios.post as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await expect(joinQueue(userId)).rejects.toThrow('Failed to join queue');
        });
    });

    describe('createPrivateQueue', () => {
        it('should call axios.post and return queueId', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';

            (axios.post as jest.Mock).mockResolvedValue({ data: { queueId } });

            const result = await createPrivateQueue(userId);

            expect(axios.post).toHaveBeenCalledWith('http://localhost:8081/api/matchmaking/queue/private', { userId });
            expect(result).toBe(queueId);
        });

        it('should throw error with message from response when AxiosError has response', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: { message: 'User already in queue' },
                status: 400,
                statusText: 'Bad Request',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.post as jest.Mock).mockRejectedValue(axiosError);

            await expect(createPrivateQueue(userId)).rejects.toThrow('User already in queue');
        });

        it('should throw default error message when AxiosError has response without message', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: {},
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.post as jest.Mock).mockRejectedValue(axiosError);

            await expect(createPrivateQueue(userId)).rejects.toThrow('Failed to create private queue');
        });

        it('should throw network error when AxiosError has request but no response', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Network Error');
            axiosError.request = {};

            (axios.post as jest.Mock).mockRejectedValue(axiosError);

            await expect(createPrivateQueue(userId)).rejects.toThrow(
                'Network error: Unable to connect to matchmaking service'
            );
        });

        it('should throw generic error for non-AxiosError', async () => {
            const userId = 'user123';

            (axios.post as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await expect(createPrivateQueue(userId)).rejects.toThrow('Failed to create private queue');
        });
    });

    describe('joinPrivateQueue', () => {
        it('should call axios.post with correct URL and request body', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';

            (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });

            await joinPrivateQueue(userId, queueId);

            expect(axios.post).toHaveBeenCalledWith(
                'http://localhost:8081/api/matchmaking/queue/private/queue-abc-123',
                { userId }
            );
        });

        it('should throw error with message from response when AxiosError has response', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: { message: 'Queue not found' },
                status: 404,
                statusText: 'Not Found',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.post as jest.Mock).mockRejectedValue(axiosError);

            await expect(joinPrivateQueue(userId, queueId)).rejects.toThrow('Queue not found');
        });

        it('should throw default error message when AxiosError has response without message', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: {},
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.post as jest.Mock).mockRejectedValue(axiosError);

            await expect(joinPrivateQueue(userId, queueId)).rejects.toThrow('Failed to join private queue');
        });

        it('should throw network error when AxiosError has request but no response', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';
            const axiosError = new AxiosError('Network Error');
            axiosError.request = {};

            (axios.post as jest.Mock).mockRejectedValue(axiosError);

            await expect(joinPrivateQueue(userId, queueId)).rejects.toThrow(
                'Network error: Unable to connect to matchmaking service'
            );
        });

        it('should throw generic error for non-AxiosError', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';

            (axios.post as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await expect(joinPrivateQueue(userId, queueId)).rejects.toThrow('Failed to join private queue');
        });
    });

    describe('leaveQueue', () => {
        it('should call axios.delete with correct URL and request body', async () => {
            const userId = 'user123';

            (axios.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

            await leaveQueue(userId);

            expect(axios.delete).toHaveBeenCalledWith('http://localhost:8081/api/matchmaking/queue', {
                data: { userId }
            });
        });

        it('should throw error with message from response when AxiosError has response', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: { message: 'User not in queue' },
                status: 404,
                statusText: 'Not Found',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.delete as jest.Mock).mockRejectedValue(axiosError);

            await expect(leaveQueue(userId)).rejects.toThrow('User not in queue');
        });

        it('should throw default error message when AxiosError has response without message', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: {},
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.delete as jest.Mock).mockRejectedValue(axiosError);

            await expect(leaveQueue(userId)).rejects.toThrow('Failed to leave queue');
        });

        it('should throw network error when AxiosError has request but no response', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Network Error');
            axiosError.request = {};

            (axios.delete as jest.Mock).mockRejectedValue(axiosError);

            await expect(leaveQueue(userId)).rejects.toThrow('Network error: Unable to connect to matchmaking service');
        });

        it('should throw generic error for non-AxiosError', async () => {
            const userId = 'user123';

            (axios.delete as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await expect(leaveQueue(userId)).rejects.toThrow('Failed to leave queue');
        });
    });

    describe('leavePrivateQueue', () => {
        it('should call axios.delete with correct URL and request body', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';

            (axios.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

            await leavePrivateQueue(userId, queueId);

            expect(axios.delete).toHaveBeenCalledWith(
                'http://localhost:8081/api/matchmaking/queue/private/queue-abc-123',
                { data: { userId } }
            );
        });

        it('should throw error with message from response when AxiosError has response', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: { message: 'Queue not found' },
                status: 404,
                statusText: 'Not Found',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.delete as jest.Mock).mockRejectedValue(axiosError);

            await expect(leavePrivateQueue(userId, queueId)).rejects.toThrow('Queue not found');
        });

        it('should throw default error message when AxiosError has response without message', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: {},
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.delete as jest.Mock).mockRejectedValue(axiosError);

            await expect(leavePrivateQueue(userId, queueId)).rejects.toThrow('Failed to leave private queue');
        });

        it('should throw network error when AxiosError has request but no response', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';
            const axiosError = new AxiosError('Network Error');
            axiosError.request = {};

            (axios.delete as jest.Mock).mockRejectedValue(axiosError);

            await expect(leavePrivateQueue(userId, queueId)).rejects.toThrow(
                'Network error: Unable to connect to matchmaking service'
            );
        });

        it('should throw generic error for non-AxiosError', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';

            (axios.delete as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await expect(leavePrivateQueue(userId, queueId)).rejects.toThrow('Failed to leave private queue');
        });
    });

    describe('getQueueStatus', () => {
        it('should return QueueStatus with isQueued true and queueId when user is in queue', async () => {
            const userId = 'user123';
            const queueId = 'queue-abc-123';
            const mockResponse = { data: { queueId } };

            (axios.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await getQueueStatus(userId);

            expect(axios.get).toHaveBeenCalledWith('http://localhost:8081/api/matchmaking/queue/status', {
                params: { userId }
            });
            expect(result).toEqual({ isQueued: true, queueId });
        });

        it('should return QueueStatus with isQueued false when status is 404', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Not Found');
            axiosError.response = {
                data: {},
                status: 404,
                statusText: 'Not Found',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            const result = await getQueueStatus(userId);

            expect(result).toEqual({ isQueued: false, queueId: null });
        });

        it('should throw error with message from response when AxiosError has non-404 response', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: { message: 'Internal server error' },
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            await expect(getQueueStatus(userId)).rejects.toThrow('Internal server error');
        });

        it('should throw default error message when AxiosError has non-404 response without message', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: {},
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            await expect(getQueueStatus(userId)).rejects.toThrow('Failed to get queue status');
        });

        it('should throw network error when AxiosError has request but no response', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Network Error');
            axiosError.request = {};

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            await expect(getQueueStatus(userId)).rejects.toThrow(
                'Network error: Unable to connect to matchmaking service'
            );
        });

        it('should throw generic error for non-AxiosError', async () => {
            const userId = 'user123';

            (axios.get as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await expect(getQueueStatus(userId)).rejects.toThrow('Failed to get queue status');
        });
    });
});
