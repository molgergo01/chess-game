'use client';

import { Button } from '@/components/ui/button';
import { createPrivateQueue } from '@/lib/clients/matchmaking.rest.client';

interface CreateLinkButtonProps {
    onCreateLink?: (queueId: string | null) => void;
    onError?: (error: Error) => void;
}

function CreateLinkButton({ onCreateLink, onError }: CreateLinkButtonProps) {
    const handleInviteLink = async () => {
        try {
            const queueId = await createPrivateQueue();
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
