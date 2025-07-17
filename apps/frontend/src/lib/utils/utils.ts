import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function getUserIdFromCookie(): string | null {
    if (typeof document === 'undefined') return null;

    const userId = document.cookie
        .split('; ')
        .find((row) => row.startsWith('userId='))
        ?.split('=')[1];

    return userId || null;
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Partially created by shadcn/ui (https://ui.shadcn.com)
