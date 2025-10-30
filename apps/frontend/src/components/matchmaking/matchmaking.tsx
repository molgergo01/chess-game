'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MatchmakingButton from '@/components/matchmaking/machmaking-button';
import { getQueueStatus, joinPrivateQueue, leavePrivateQueue, leaveQueue } from '@/lib/clients/matchmaking.rest.client';
import LeaveMatchmakingButton from '@/components/matchmaking/leave-matchmaking-button';
import { useMatchmakingSocket } from '@/hooks/matchmaking/useMatchmakingSocket';
import CreateLinkButton from '@/components/matchmaking/create-link-button';
import CancelInviteButton from '@/components/matchmaking/cancel-invite-button';
import ErrorAlert from '@/components/ui/error-alert';
import { Card, CardContent } from '@/components/ui/card';
import CopyableLink from '@/components/ui/copyable-link';
import LoadingScreen from '@/components/ui/loading-screen';

function Matchmaking() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const searchParamQueueId = searchParams.get('id');
    const [isQueued, setIsQueued] = useState<boolean | null>(null);
    const [queueId, setQueueId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);
    const [isNewQueue, setIsNewQueue] = useState(false);
    const { socket } = useMatchmakingSocket();

    const checkQueueStatus = useCallback(
        async (markAsNew = false) => {
            try {
                const queueStatus = await getQueueStatus();

                if (queueStatus.hasActiveGame) {
                    router.push('/game');
                    return;
                }

                setIsQueued(queueStatus.isQueued);
                setQueueId(queueStatus.queueId);
                setErrorMessage(null);
                if (markAsNew && queueStatus.queueId) {
                    setIsNewQueue(true);
                }
            } catch (error) {
                console.error('Failed to check queue status:', error);
                setIsQueued(false);
                setQueueId(null);
                if (error instanceof Error) {
                    setErrorMessage(error.message);
                }
            }
        },
        [router]
    );

    const handleError = useCallback((error: Error) => {
        setErrorMessage(error.message);
        setTimeout(() => setErrorMessage(null), 5000);
    }, []);

    useEffect(() => {
        const handleBeforeUnload = async () => {
            if (!isQueued) return;

            if (!queueId) {
                await leaveQueue();
            } else {
                await leavePrivateQueue(queueId);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isQueued, queueId]);

    useEffect(() => {
        if (!socket) return;

        const handleMatchmake = () => {
            setIsQueued(false);
            router.push('/game');
        };

        socket.on('matchmake', handleMatchmake);

        return () => {
            socket.off('matchmake', handleMatchmake);
        };
    }, [socket, router]);

    useEffect(() => {
        checkQueueStatus();
    }, [checkQueueStatus]);

    useEffect(() => {
        if (isNewQueue) {
            const timer = setTimeout(() => setIsNewQueue(false), 100);
            return () => clearTimeout(timer);
        }
    }, [isNewQueue]);

    useEffect(() => {
        if (isQueued || !searchParamQueueId || hasAttemptedJoin) return;
        setHasAttemptedJoin(true);
        joinPrivateQueue(searchParamQueueId)
            .then(() => {
                checkQueueStatus();
            })
            .catch((error) => {
                if (error instanceof Error) {
                    handleError(error);
                }
            });
        router.replace(pathname);
    }, [checkQueueStatus, handleError, hasAttemptedJoin, isQueued, pathname, router, searchParamQueueId, searchParams]);

    function getLink() {
        return `${window.location.origin}${pathname}?id=${queueId}`;
    }

    if (isQueued === null) {
        return <LoadingScreen />;
    }

    return (
        <div className="flex h-full flex-col items-center justify-center p-6 md:p-10">
            {errorMessage && (
                <ErrorAlert
                    message={errorMessage}
                    title="Matchmaking Error"
                    className="w-full max-w-md p-6 md:p-8"
                    data-cy="matchmaking-error-alert"
                />
            )}
            <div className="w-full max-w-md">
                <Card className="overflow-hidden bg-muted" data-cy="matchmaking-card">
                    <CardContent className="p-0">
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col gap-10 md:gap-20">
                                <div className="flex flex-col items-center text-center">
                                    <h1 className="text-2xl font-bold" data-cy="matchmaking-header">
                                        Play Chess
                                    </h1>
                                </div>

                                {!isQueued && (
                                    <div className="flex flex-col gap-4">
                                        <MatchmakingButton onJoinQueue={checkQueueStatus} onError={handleError} />
                                        <CreateLinkButton
                                            onCreateLink={() => checkQueueStatus(true)}
                                            onError={handleError}
                                        />
                                    </div>
                                )}
                                {isQueued && queueId === null && (
                                    <div className="flex flex-col gap-6 items-center">
                                        <p className="text-muted-foreground" data-cy="matchmaking-searching-text">
                                            Searching for an opponent...
                                        </p>
                                        <LeaveMatchmakingButton onLeaveQueue={checkQueueStatus} onError={handleError} />
                                    </div>
                                )}
                                {isQueued && queueId !== null && (
                                    <div className="flex flex-col gap-6">
                                        <CopyableLink link={getLink()} autoCopy={isNewQueue} />
                                        <p className="text-center" data-cy="matchmaking-waiting-text">
                                            Waiting for friend to join...
                                        </p>
                                        <CancelInviteButton
                                            onLeaveQueue={checkQueueStatus}
                                            onError={handleError}
                                            queueId={queueId}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default Matchmaking;
