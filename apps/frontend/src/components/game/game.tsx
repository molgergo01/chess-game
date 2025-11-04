'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useChessGame from '@/hooks/chess/useChessGame';
import ChatBox from '@/components/game/chat/chat-box';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Winner } from '@/lib/models/response/game';
import Timer, { TimerRef } from '@/components/ui/timer';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import ChessboardWithBanners from '@/components/ui/chessboard-with-banners';
import LoadingScreen from '@/components/ui/loading-screen';
import GameControls from '@/components/game/controls/game-controls';
import useChat from '@/hooks/chat/useChat';
import { sendChatMessage } from '@/lib/clients/core.socket.client';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import ErrorAlert from '@/components/ui/error-alert';

function Game({ className, ...props }: React.ComponentProps<'div'>) {
    const router = useRouter();
    const {
        color,
        boardPosition,
        turnColor,
        timesRemaining,
        gameOver,
        winner,
        onDrop,
        whitePlayer,
        blackPlayer,
        ratingChange,
        gameId,
        drawOffer,
        timeUntilAbandoned,
        criticalError,
        clearCriticalError
    } = useChessGame();
    const { messages } = useChat(gameId, gameOver);
    const { socket } = useCoreSocket();

    const whiteTimerRef = useRef<TimerRef>(null);
    const blackTimerRef = useRef<TimerRef>(null);
    const [whiteTimeLeft, setWhiteTimeLeft] = useState(10 * 60 * 1000);
    const [blackTimeLeft, setBlackTimeLeft] = useState(10 * 60 * 1000);
    const [abandonTimerInitialized, setAbandonTimerInitialized] = useState(false);

    const handleWhiteTimerTick = useCallback((time: number) => {
        setWhiteTimeLeft(time);
    }, []);

    const handleBlackTimerTick = useCallback((time: number) => {
        setBlackTimeLeft(time);
    }, []);

    useEffect(() => {
        if (gameOver) return;

        if (timeUntilAbandoned) {
            if (!abandonTimerInitialized && whiteTimerRef.current) {
                whiteTimerRef.current?.setTimeLeft(timeUntilAbandoned);
                whiteTimerRef.current?.start();
                blackTimerRef.current?.stop();
                setAbandonTimerInitialized(true);
            }
            return;
        }

        whiteTimerRef.current?.stop();
        blackTimerRef.current?.stop();

        if (timesRemaining) {
            blackTimerRef.current?.setTimeLeft(timesRemaining?.blackTimeRemaining);
            whiteTimerRef.current?.setTimeLeft(timesRemaining?.whiteTimeRemaining);
        }

        if (turnColor === MatchmakingColor.WHITE) {
            whiteTimerRef.current?.start();
        } else if (turnColor === MatchmakingColor.BLACK) {
            blackTimerRef.current?.start();
        }
    }, [turnColor, gameOver, timesRemaining, timeUntilAbandoned, abandonTimerInitialized]);

    useEffect(() => {
        if (gameOver) {
            whiteTimerRef.current?.stop();
            blackTimerRef.current?.stop();
        }
    }, [gameOver]);

    const handleReset = () => {
        router.push('/play');
    };

    if (!color || !turnColor || !timesRemaining || !whitePlayer || !blackPlayer || !gameId || !socket) {
        return <LoadingScreen />;
    }

    const playerRatingChange =
        color === MatchmakingColor.WHITE ? ratingChange?.whiteRatingChange : ratingChange?.blackRatingChange;
    const playerNewRating =
        color === MatchmakingColor.WHITE ? ratingChange?.whiteNewRating : ratingChange?.blackNewRating;

    const getRatingChangeColor = (change: number | undefined) => {
        if (!change) return 'text-gray-500';
        if (change > 0) return 'text-green-500';
        if (change < 0) return 'text-red-500';
        return 'text-gray-500';
    };

    return (
        <div className={`flex flex-col flex-1 min-h-0 ${className}`} data-cy="game-container" {...props}>
            <Timer ref={whiteTimerRef} defaultTime={timesRemaining.whiteTimeRemaining} onTick={handleWhiteTimerTick} />
            <Timer ref={blackTimerRef} defaultTime={timesRemaining.blackTimeRemaining} onTick={handleBlackTimerTick} />

            {criticalError && (
                <ErrorAlert
                    title="Game Error"
                    message={criticalError}
                    className="mx-4 mt-4"
                    onClick={clearCriticalError}
                    data-cy="critical-error-alert"
                />
            )}

            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto sm:overflow-visible sm:items-center sm:justify-center sm:p-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full h-full min-h-0 aspect-square sm:aspect-auto sm:w-auto sm:h-auto sm:max-w-[90vw] sm:items-start sm:gap-2">
                    <div className="flex flex-col sm:gap-1 flex-shrink-0">
                        <ChessboardWithBanners
                            boardPosition={boardPosition.toString()}
                            boardOrientation={color}
                            turnColor={turnColor}
                            whitePlayerInfo={whitePlayer}
                            blackPlayerInfo={blackPlayer}
                            whiteTimeLeft={whiteTimeLeft}
                            blackTimeLeft={blackTimeLeft}
                            onPieceDrop={onDrop}
                            allowDragging={true}
                        />
                    </div>

                    <div
                        className="flex-1 min-h-[200px] sm:min-h-0 sm:flex-initial sm:w-auto sm:min-w-[200px] sm:max-w-[300px] md:min-w-[250px] md:max-w-[350px] sm:h-[calc(min(350px,min(45vw,calc(100vh-12rem)))+13rem)] md:h-[calc(min(425px,min(45vw,calc(100vh-12rem)))+14rem)] lg:h-[calc(min(500px,min(45vw,calc(100vh-12rem)))+18.7rem)]"
                        data-cy="game-chatbox"
                    >
                        <div className="flex flex-col h-full w-full gap-2">
                            <ChatBox
                                messages={messages}
                                onSend={async (message: string) => {
                                    await sendChatMessage(socket, gameId, message);
                                }}
                                className="flex-1 min-h-0"
                            />
                            <GameControls
                                gameId={gameId}
                                color={color}
                                drawOffer={drawOffer}
                                gameStarted={timeUntilAbandoned === null}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Dialog open={gameOver} data-cy="game-over-dialog">
                <DialogContent hideClose>
                    <DialogHeader>
                        <DialogTitle className="text-center">Game Over</DialogTitle>
                        <DialogDescription data-cy="game-over-message" className="flex flex-col items-center gap-2">
                            <span className="text-xl font-semibold text-foreground">
                                {winner === Winner.WHITE && 'White wins'}
                                {winner === Winner.BLACK && 'Black wins'}
                                {winner === Winner.DRAW && 'Draw'}
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="text-base" data-cy="new-rating">
                                    New rating: {playerNewRating}
                                </span>
                                <span
                                    className={`text-sm ${getRatingChangeColor(playerRatingChange)}`}
                                    data-cy="rating-change"
                                >
                                    {playerRatingChange !== undefined && playerRatingChange >= 0 ? '+' : ''}
                                    {playerRatingChange}
                                </span>
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose onClick={handleReset}>Confirm</DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default Game;
