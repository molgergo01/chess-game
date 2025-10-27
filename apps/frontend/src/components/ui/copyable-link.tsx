'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface CopyableLinkProps {
    link: string;
    autoCopy?: boolean;
}

export default function CopyableLink({ link, autoCopy = false }: CopyableLinkProps) {
    const [copySuccess, setCopySuccess] = useState<boolean>(autoCopy);

    const handleCopyLink = () => {
        copyToClipboard(link);
    };

    useEffect(() => {
        if (autoCopy) {
            copyToClipboard(link);
        }
    }, [autoCopy, link]);

    function copyToClipboard(link: string) {
        navigator.clipboard
            .writeText(link)
            .then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            })
            .catch((error) => {
                console.error('Failed to auto-copy link:', error);
                setCopySuccess(false);
            });
    }

    return (
        <div className="relative p-4 bg-background rounded-lg border" data-cy="matchmaking-invite-link-container">
            <input
                type="text"
                readOnly
                value={link}
                className="w-full bg-transparent text-sm text-center outline-none pr-20"
                data-cy="matchmaking-invite-link"
            />
            <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                data-cy="matchmaking-copy-link-button"
            >
                {copySuccess ? 'Copied!' : 'Copy'}
            </Button>
        </div>
    );
}
