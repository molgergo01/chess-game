'use client';

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getUser } from '@/lib/clients/auth.rest.client';

interface AuthContextType {
    userId: string | null;
    userName: string | null;
    userAvatarUrl: string | null;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

    const fetchUserData = async () => {
        try {
            const user = await getUser();

            setUserId(user.id);
            setUserName(user.name);
            setUserAvatarUrl(user.avatarUrl);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            setUserId(null);
            setUserName(null);
            setUserAvatarUrl(null);
        }
    };

    useEffect(() => {
        if (pathname === '/login') {
            return;
        }
        fetchUserData();
    }, [pathname]);

    return (
        <AuthContext.Provider value={{ userId, userName, userAvatarUrl, refetch: fetchUserData }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
