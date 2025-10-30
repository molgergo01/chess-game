'use client';

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { disconnectCoreSocket, initializeCoreSocket } from '@/lib/sockets/core.socket';
import { useAuth } from '@/hooks/auth/useAuth';

interface CoreSocketContextType {
    socket: Socket | null;
}

const CoreSocketContext = createContext<CoreSocketContextType | null>(null);

interface CoreSocketProviderProps {
    children: ReactNode;
}

export function CoreSocketProvider({ children }: CoreSocketProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { userId } = useAuth();

    useEffect(() => {
        if (!userId) return;

        const socketInstance = initializeCoreSocket();
        setSocket(socketInstance);

        return () => {
            try {
                disconnectCoreSocket();
                setSocket(null);
            } catch (error) {
                console.warn('Socket disconnect error:', error);
                setSocket(null);
            }
        };
    }, [userId]);

    return <CoreSocketContext.Provider value={{ socket }}>{children}</CoreSocketContext.Provider>;
}

export function useCoreSocket() {
    const context = useContext(CoreSocketContext);
    if (!context) {
        throw new Error('useSocket must be used within CoreSocketProvider');
    }
    return context;
}
