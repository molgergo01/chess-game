'use client';

import { usePathname } from 'next/navigation';
import LogoutButton from './login/logout-button';

export default function NavBar() {
    const pathName = usePathname();
    const isLoginPage = pathName === '/login';

    if (isLoginPage) return null;

    return (
        <div>
            <LogoutButton />
        </div>
    );
}
