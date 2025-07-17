import axios from 'axios';
import env from '@/lib/config/env';
import { JoinQueueRequest } from '@/lib/models/request/matchmaking';

export async function joinQueue(userId: string) {
    const requestBody: JoinQueueRequest = {
        userId: userId
    };
    return axios.post(
        `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`,
        requestBody
    );
}

export async function leaveQueue(userId: string) {
    return axios.delete(
        `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/${userId}`
    );
}

export async function isInQueue(userId: string): Promise<boolean> {
    const res = await axios.get(
        `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/${userId}`,
        {
            validateStatus: (status) => status === 200 || status === 404
        }
    );
    return res.status === 200;
}
