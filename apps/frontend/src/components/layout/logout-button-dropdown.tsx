'use client';

import { DropdownMenuItem } from '@radix-ui/react-dropdown-menu';
import { cookies } from 'next/headers';

export default function LogoutButton() {
    return (
        <DropdownMenuItem onClick={handleLogout} data-cy={'logout-button'}>
            Logout
        </DropdownMenuItem>
    );

    async function handleLogout() {
        try {
            await fetch('http://localhost:8080/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            const cookieStore = await cookies();
            cookieStore.delete('token');
            console.log(e);
        }
        window.location.href = 'http://localhost:3000/login';
    }
}
