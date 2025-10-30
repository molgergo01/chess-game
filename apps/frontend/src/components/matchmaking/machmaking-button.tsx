'use client';

import { Button } from '@/components/ui/button';
import { joinQueue } from '@/lib/clients/matchmaking.rest.client';

interface MatchmakingButtonProps {
    onJoinQueue?: () => void;
    onError?: (error: Error) => void;
}

function MatchmakingButton({ onJoinQueue, onError }: MatchmakingButtonProps) {
    const handleMatchmaking = async () => {
        try {
            await joinQueue();
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
