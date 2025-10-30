import axios, { AxiosError, AxiosResponse } from 'axios';
import env from '@/lib/config/env';
import { GetQueueStatusResponse } from '@/lib/models/response/matchmaking';
import { QueueStatus } from '@/lib/models/matchmaking/matchmaking';

export async function joinQueue() {
    try {
        await axios.post(
            `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`,
            {},
            {
                withCredentials: true
            }
        );
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to join queue');
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to matchmaking service');
        } else {
            throw new Error('Failed to join queue');
        }
    }
}

export async function createPrivateQueue(): Promise<string> {
    try {
        const response = await axios.post(
            `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private`,
            {},
            {
                withCredentials: true
            }
        );
        return response.data.queueId;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to create private queue');
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to matchmaking service');
        } else {
            throw new Error('Failed to create private queue');
        }
    }
}

export async function joinPrivateQueue(queueId: string) {
    try {
        await axios.post(
            `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private/${queueId}`,
            {},
            {
                withCredentials: true
            }
        );
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to join private queue');
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to matchmaking service');
        } else {
            throw new Error('Failed to join private queue');
        }
    }
}

export async function leaveQueue() {
    try {
        await axios.delete(`${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, {
            withCredentials: true
        });
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to leave queue');
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to matchmaking service');
        } else {
            throw new Error('Failed to leave queue');
        }
    }
}

export async function leavePrivateQueue(queueId: string) {
    try {
        await axios.delete(`${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private/${queueId}`, {
            withCredentials: true
        });
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to leave private queue');
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to matchmaking service');
        } else {
            throw new Error('Failed to leave private queue');
        }
    }
}

export async function getQueueStatus(): Promise<QueueStatus> {
    try {
        const res: AxiosResponse<GetQueueStatusResponse> = await axios.get(
            `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/status`,
            {
                withCredentials: true
            }
        );
        return {
            isQueued: res.data.isQueued,
            queueId: res.data.queueId,
            hasActiveGame: res.data.hasActiveGame
        };
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to get queue status');
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to matchmaking service');
        } else {
            throw new Error('Failed to get queue status');
        }
    }
}
