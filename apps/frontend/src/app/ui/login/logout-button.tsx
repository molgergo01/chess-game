'use client';

export default function LogoutButton() {
    return (
        <button
            className="bg-red-500 px-4 py-2 text-white"
            onClick={handleLogout}
        >
            Logout
        </button>
    );

    async function handleLogout() {
        await fetch('http://localhost:8080/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = 'http://localhost:3000/login';
    }
}
