'use client';

import { DropdownMenuItem } from '@radix-ui/react-dropdown-menu';

export default function LogoutButton() {
    return (
        <DropdownMenuItem onClick={handleLogout} data-cy={'logout-button'}>
            Logout
        </DropdownMenuItem>
    );

    async function handleLogout() {
        await fetch('http://localhost:8080/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = 'http://localhost:3000/login';
    }
}
