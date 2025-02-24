'use client';
import axios, { AxiosError } from 'axios';

import { DropdownMenuItem } from '@radix-ui/react-dropdown-menu';

export default function LogoutButton() {
    return (
        <DropdownMenuItem onClick={handleLogout} data-cy={'logout-button'}>
            Logout
        </DropdownMenuItem>
    );

    async function handleLogout() {
        try {
            await axios.post(
                'http://localhost:8080/api/auth/logout',
                {},
                { withCredentials: true }
            );

            window.location.href = 'http://localhost:3000/login';
        } catch (e) {
            if (e instanceof AxiosError) {
                console.error(e.response?.statusText);
            } else {
                console.error(e);
            }
        }
    }
}
