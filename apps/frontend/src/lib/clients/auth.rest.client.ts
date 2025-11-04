import env from '@/lib/config/env';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { AuthUser, GetMeResponse } from '@/lib/models/response/auth';

export async function getUser(): Promise<AuthUser> {
    try {
        const response: AxiosResponse<GetMeResponse> = await axios.get(`${env.REST_URLS.AUTH}/api/auth/user/me`, {
            withCredentials: true
        });

        return response.data.user;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to get user');
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to core service');
        } else {
            throw new Error('Failed to get user');
        }
    }
}
