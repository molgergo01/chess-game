'use client';
import axios, { AxiosError } from 'axios';

import { useRouter } from 'next/navigation';
import env from '@/lib/config/env';

export default function LogoutButton() {
    const router = useRouter();
    return (
        <div onClick={handleLogout} data-cy={'logout-button'}>
            Logout
        </div>
    );

    async function handleLogout() {
        try {
            await axios.post(`${env.REST_URLS.AUTH}/api/auth/logout`, {}, { withCredentials: true });

            router.push('/login');
        } catch (e) {
            if (e instanceof AxiosError) {
                console.error(e);
            } else {
                console.error(e);
            }
        }
    }
}
