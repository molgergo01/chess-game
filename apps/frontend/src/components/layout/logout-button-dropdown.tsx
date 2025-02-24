'use client';
import axios from 'axios';

import { DropdownMenuItem } from '@radix-ui/react-dropdown-menu';

export default function LogoutButton() {
    return (
        <DropdownMenuItem onClick={handleLogout} data-cy={'logout-button'}>
            Logout
        </DropdownMenuItem>
    );

    async function handleLogout() {
        axios
            .post('http://localhost:8080/api/auth/logout')
            .catch((e) => {
                console.error(e.response?.statusText);
            })
            .then(() => {
                window.location.href = 'http://localhost:3000/login';
            });
    }
}
