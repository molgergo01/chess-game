'use client';

import { Button } from '@/components/ui/button';
import { leaveQueue } from '@/lib/clients/matchmaking.rest.client';

interface LeaveMatchmakingButtonProps {
    onLeaveQueue?: () => void;
    onError?: (error: Error) => void;
}

function LeaveMatchmakingButton({ onLeaveQueue, onError }: LeaveMatchmakingButtonProps) {
    const handleLeave = async () => {
        try {
            await leaveQueue();
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
