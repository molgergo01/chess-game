'use client';

import { Button } from '@/components/ui/button';
import { leaveQueue } from '@/lib/clients/matchmaking.rest.client';
import { useAuth } from '@/hooks/auth/useAuth';

interface LeaveMatchmakingButtonProps {
    onLeaveQueue?: () => void;
    onError?: (error: Error) => void;
}

function LeaveMatchmakingButton({ onLeaveQueue, onError }: LeaveMatchmakingButtonProps) {
    const { userId } = useAuth();
    const handleLeave = async () => {
        if (!userId) {
            const error = new Error('User id is not set');
            onError?.(error);
            return;
        }
        try {
            await leaveQueue(userId);
            onLeaveQueue?.();
        } catch (error) {
            if (error instanceof Error) {
                onError?.(error);
            }
        }
    };

    return (
        <Button className="w-fit" onClick={handleLeave} data-cy="matchmaking-button-leave">
            <span>Cancel</span>
        </Button>
    );
}

export default LeaveMatchmakingButton;
