'use client';

import ErrorAlert from '@/components/ui/error-alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const router = useRouter();

    const handleRetry = () => {
        reset();
        router.refresh();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                <ErrorAlert
                    message={error.message || 'An unexpected error occurred'}
                    title="Game History Error"
                    className="w-full"
                    data-cy="game-history-error-alert"
                />
                <Button onClick={handleRetry} className="w-full" variant="outline">
                    Try again
                </Button>
            </div>
        </div>
    );
}
