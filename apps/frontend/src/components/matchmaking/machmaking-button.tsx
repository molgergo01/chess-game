'use client';

import { Button } from '@/components/ui/button';
import { joinQueue } from '@/lib/clients/matchmaking.rest.client';
import { useAuth } from '@/hooks/auth/useAuth';

interface MatchmakingButtonProps {
    onJoinQueue?: () => void;
    onError?: (error: Error) => void;
}

function MatchmakingButton({ onJoinQueue, onError }: MatchmakingButtonProps) {
    const { userId } = useAuth();
    const handleMatchmaking = async () => {
        if (!userId) {
            const error = new Error('User id is not set');
            onError?.(error);
            return;
        }
        try {
            await joinQueue(userId);
            onJoinQueue?.();
        } catch (error) {
            if (error instanceof Error) {
                onError?.(error);
            }
        }
    };

    return (
        <Button className="w-full md:w-3/4 md:mx-auto" onClick={handleMatchmaking} data-cy="matchmaking-button-join">
            Play Online
        </Button>
    );
}

export default MatchmakingButton;
