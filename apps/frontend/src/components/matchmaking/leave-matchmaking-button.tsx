'use client';

import { Button } from '@/components/ui/button';
import { leaveQueue } from '@/lib/clients/matchmaking.rest.client';
import { useAuth } from '@/hooks/auth/useAuth';

interface MatchmakingButtonProps {
    onLeaveQueue?: () => void;
}

function LeaveMatchmakingButton({ onLeaveQueue }: MatchmakingButtonProps) {
    const { userId } = useAuth();
    const handleMatchmaking = async () => {
        if (!userId) {
            throw Error('User id is not set');
        }
        await leaveQueue(userId);
        onLeaveQueue?.();
    };

    return (
        <Button
            className="w-fit"
            onClick={handleMatchmaking}
            data-cy="matchmaking-button"
        >
            <span>Leave Queue</span>
        </Button>
    );
}

export default LeaveMatchmakingButton;
