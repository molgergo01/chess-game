'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MatchmakingButton from '@/components/matchmaking/machmaking-button';
import { isInQueue, leaveQueue } from '@/lib/clients/matchmaking.rest.client';
import { MatchmakeMessage } from '@/lib/models/request/matchmaking';
import LeaveMatchmakingButton from '@/components/matchmaking/leave-matchmaking-button';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMatchmakingSocket } from '@/hooks/matchmaking/useMatchmakingSocket';

function Matchmaking({ className, ...props }: React.ComponentProps<'div'>) {
    const router = useRouter();
    const { userId } = useAuth();
    const [isQueued, setIsQueued] = useState<boolean | null>(null);
    const { socket } = useMatchmakingSocket();

    const checkQueueStatus = useCallback(async () => {
        if (!userId) return;
        try {
            setIsQueued(await isInQueue(userId));
        } catch (error) {
            console.error('Failed to check queue status:', error);
            setIsQueued(false);
        }
    }, [userId]);

    useEffect(() => {
        const handleBeforeUnload = async () => {
            if (!isQueued || !userId) return;

            await leaveQueue(userId);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isQueued, userId]);

    useEffect(() => {
        if (!socket) return;

        const handleMatchmake = (matchmakeMessage: MatchmakeMessage) => {
            localStorage.setItem(
                'playerData',
                JSON.stringify(matchmakeMessage.players)
            );
            //TODO Do something with player colors
            setIsQueued(false);
            router.push('/game');
        };

        socket.on('matchmake', handleMatchmake);

        return () => {
            socket.off('matchmake', handleMatchmake);
        };
    }, [socket, router]);

    useEffect(() => {
        checkQueueStatus();
    }, [checkQueueStatus]);

    return (
        <div className={className} {...props}>
            {isQueued === false && (
                <MatchmakingButton onJoinQueue={checkQueueStatus} />
            )}
            {isQueued === true && (
                <div className="flex flex-col items-center">
                    <span className="p-10">Searching for an opponent...</span>
                    <LeaveMatchmakingButton onLeaveQueue={checkQueueStatus} />
                </div>
            )}
            {isQueued === null && <div>Loading...</div>}
        </div>
    );
}

export default Matchmaking;
