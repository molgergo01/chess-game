'use client';

import { Button } from '@/components/ui/button';
import { createPrivateQueue } from '@/lib/clients/matchmaking.rest.client';
import { useAuth } from '@/hooks/auth/useAuth';

interface CreateLinkButtonProps {
    onCreateLink?: (queueId: string | null) => void;
    onError?: (error: Error) => void;
}

function CreateLinkButton({ onCreateLink, onError }: CreateLinkButtonProps) {
    const { userId } = useAuth();
    const handleInviteLink = async () => {
        if (!userId) {
            const error = new Error('User id is not set');
            onError?.(error);
            return;
        }

        try {
            const queueId = await createPrivateQueue(userId);
            onCreateLink?.(queueId);
        } catch (error) {
            if (error instanceof Error) {
                onError?.(error);
            }
        }
    };

    return (
        <Button
            className="w-full md:w-3/4 md:mx-auto"
            onClick={handleInviteLink}
            data-cy="matchmaking-button-invite-link"
        >
            Play a Friend
        </Button>
    );
}

export default CreateLinkButton;
