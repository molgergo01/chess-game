'use client';

export default function LoginButton() {
    const handleLogin = () => {
        window.location.href = 'http://localhost:8080/api/auth/google';
    };

    return (
        <button
            className="bg-blue-500 px-4 py-2 text-white"
            onClick={handleLogin}
        >
            Login With Google
        </button>
    );
}
