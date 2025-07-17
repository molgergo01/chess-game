import env from '@/lib/config/env';
import axios from 'axios';

export async function getUser() {
    return axios.get(`${env.REST_URLS.AUTH}/api/user/me`, {
        withCredentials: true
    });
}
