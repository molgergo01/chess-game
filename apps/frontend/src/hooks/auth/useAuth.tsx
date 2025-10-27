'use client';

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getUser } from '@/lib/clients/auth.rest.client';

interface AuthContextType {
    userId: string | null;
    userName: string | null;
    userAvatarUrl: string | null;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

    const fetchUserData = async () => {
        try {
            const response = await getUser();

            if (response.status === 200) {
                const data = response.data;
                setUserId(data.id);
                setUserName(data.name);
                setUserAvatarUrl(data.avatarUrl);
            } else {
                setUserId(null);
                setUserName(null);
                setUserAvatarUrl(null);
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            setUserId(null);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

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
