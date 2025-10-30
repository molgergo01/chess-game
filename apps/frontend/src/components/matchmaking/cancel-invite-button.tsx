'use client';

import { Button } from '@/components/ui/button';
import { leavePrivateQueue } from '@/lib/clients/matchmaking.rest.client';

interface CancelInviteButtonProps {
    onLeaveQueue?: () => void;
    onError?: (error: Error) => void;
    queueId: string | null;
}

function CancelInviteButton({ onLeaveQueue, onError, queueId }: CancelInviteButtonProps) {
    const handleLeave = async () => {
        if (!queueId) {
            const error = new Error('QueueId is not set');
            onError?.(error);
            return;
        }
        try {
            await leavePrivateQueue(queueId);
            onLeaveQueue?.();
        } catch (error) {
            if (error instanceof Error) {
                onError?.(error);
            }
        }
    };

    return (
        <Button className="w-full md:w-3/4 md:mx-auto" onClick={handleLeave} data-cy="matchmaking-button-leave">
            Cancel
        </Button>
    );
}

export default CancelInviteButton;
