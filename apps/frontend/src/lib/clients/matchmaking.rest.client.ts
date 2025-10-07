import axios, { AxiosError, AxiosResponse } from 'axios';
import env from '@/lib/config/env';
import {
    CreateQueueRequest,
    GetQueueStatusParams,
    JoinQueueRequest,
    LeaveQueueRequest
} from '@/lib/models/request/matchmaking';
import { GetQueueStatusResponse } from '@/lib/models/response/matchmaking';
import { QueueStatus } from '@/lib/models/matchmaking/matchmaking';

export async function joinQueue(userId: string) {
    const requestBody: JoinQueueRequest = {
        userId: userId
    };
    try {
        await axios.post(`${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, requestBody);
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

export async function createPrivateQueue(userId: string): Promise<string> {
    const requestBody: CreateQueueRequest = {
        userId: userId
    };
    try {
        const response = await axios.post(`${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private`, requestBody);
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

export async function joinPrivateQueue(userId: string, queueId: string) {
    const requestBody: JoinQueueRequest = {
        userId: userId
    };
    try {
        await axios.post(`${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private/${queueId}`, requestBody);
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

export async function leaveQueue(userId: string) {
    const requestBody: LeaveQueueRequest = {
        userId: userId
    };
    try {
        await axios.delete(`${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, {
            data: requestBody
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

export async function leavePrivateQueue(userId: string, queueId: string) {
    const requestBody: LeaveQueueRequest = {
        userId: userId
    };
    try {
        await axios.delete(`${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private/${queueId}`, {
            data: requestBody
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

export async function getQueueStatus(userId: string): Promise<QueueStatus> {
    const requestBody: GetQueueStatusParams = {
        userId: userId
    };
    try {
        const res: AxiosResponse<GetQueueStatusResponse> = await axios.get(
            `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/status`,
            {
                params: requestBody
            }
        );
        return {
            isQueued: true,
            queueId: res.data.queueId
        };
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            if (error.response.status === 404) {
                return {
                    isQueued: false,
                    queueId: null
                };
            }
            throw new Error(error.response.data.message || 'Failed to get queue status');
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to matchmaking service');
        } else {
            throw new Error('Failed to get queue status');
        }
    }
}
