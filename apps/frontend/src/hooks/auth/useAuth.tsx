'use client';

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState
} from 'react';
import { getUser } from '@/lib/clients/auth.rest.client';

interface AuthContextType {
    userId: string | null;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [userId, setUserId] = useState<string | null>(null);

    const fetchUserData = async () => {
        try {
            const response = await getUser();

            if (response.status === 200) {
                const data = await response.data;
                setUserId(data.id);
            } else {
                setUserId(null);
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
        <AuthContext.Provider value={{ userId, refetch: fetchUserData }}>
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
