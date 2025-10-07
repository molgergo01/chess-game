'use client';

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/auth/useAuth';
import { initializeMatchmakingSocket } from '@/lib/sockets/matchmaking.socket';

interface MatchmakingSocketContextType {
    socket: Socket | null;
}

const MatchmakingSocketContext = createContext<MatchmakingSocketContextType | null>(null);

interface MatchmakingSocketProviderProps {
    children: ReactNode;
}

export function MatchmakingSocketProvider({ children }: MatchmakingSocketProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { userId } = useAuth();

    useEffect(() => {
        if (!userId) return;

        const socketInstance = initializeMatchmakingSocket(userId);
        setSocket(socketInstance);

        return () => {
            try {
                if (socketInstance && !socketInstance.disconnected) {
                    socketInstance.disconnect();
                }
            } catch (error) {
                console.warn('Socket disconnect error:', error);
            }
        };
    }, [userId]);

    return <MatchmakingSocketContext.Provider value={{ socket }}>{children}</MatchmakingSocketContext.Provider>;
}

export function useMatchmakingSocket() {
    const context = useContext(MatchmakingSocketContext);
    if (!context) {
        throw new Error('useSocket must be used within MatchmakingSocketProvider');
    }
    return context;
}
