'use client';

import { Button } from '@/components/ui/button';
import { joinQueue } from '@/lib/clients/matchmaking.rest.client';
import { useAuth } from '@/hooks/auth/useAuth';

interface MatchmakingButtonProps {
    onJoinQueue?: () => void;
}

function MatchmakingButton({ onJoinQueue }: MatchmakingButtonProps) {
    const { userId } = useAuth();
    const handleMatchmaking = async () => {
        if (!userId) {
            throw Error('User id is not set');
        }
        await joinQueue(userId);
        onJoinQueue?.();
    };

    return (
        <Button
            className="w-fit"
            onClick={handleMatchmaking}
            data-cy="matchmaking-button"
        >
            <span>Queue</span>
        </Button>
    );
}

export default MatchmakingButton;
