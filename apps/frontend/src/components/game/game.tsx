'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Fen from 'chess-fen';
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

function Game({ className, ...props }: React.ComponentProps<'div'>) {
    const router = useRouter();
    const { color, boardPosition, turnColor, timesRemaining, gameOver, winner, onDrop, whitePlayer, blackPlayer } =
        useChessGame();

    const whiteTimerRef = useRef<TimerRef>(null);
    const blackTimerRef = useRef<TimerRef>(null);
    const [whiteTimeLeft, setWhiteTimeLeft] = useState(10 * 60 * 1000);
    const [blackTimeLeft, setBlackTimeLeft] = useState(10 * 60 * 1000);

    const handleWhiteTimerTick = useCallback((time: number) => {
        setWhiteTimeLeft(time);
    }, []);

    const handleBlackTimerTick = useCallback((time: number) => {
        setBlackTimeLeft(time);
    }, []);

    const gameStarted = boardPosition.toString() !== Fen.startingPosition;

    useEffect(() => {
        if (!gameStarted || gameOver) return;

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
    }, [turnColor, gameStarted, gameOver, timesRemaining]);

    useEffect(() => {
        if (gameOver) {
            whiteTimerRef.current?.stop();
            blackTimerRef.current?.stop();
        }
    }, [gameOver]);

    const handleReset = () => {
        router.push('/play');
    };

    if (!color || !turnColor || !timesRemaining || !whitePlayer || !blackPlayer) {
        return <LoadingScreen />;
    }

    return (
        <div className={`flex flex-col flex-1 min-h-0 ${className}`} data-cy="game-container" {...props}>
            <Timer ref={whiteTimerRef} defaultTime={timesRemaining.whiteTimeRemaining} onTick={handleWhiteTimerTick} />
            <Timer ref={blackTimerRef} defaultTime={timesRemaining.blackTimeRemaining} onTick={handleBlackTimerTick} />

            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto sm:overflow-visible sm:items-center sm:justify-center sm:p-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full h-full min-h-0 sm:w-auto sm:h-auto sm:max-h-[min(700px,calc(100vh-7rem))] lg:max-h-[min(850px,calc(100vh-7rem))] aspect-square sm:gap-2">
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
                        className="flex-1 min-h-[200px] sm:min-h-0 sm:w-auto sm:min-w-[250px] sm:max-w-[350px] sm:self-stretch"
                        data-cy="game-chatbox"
                    >
                        <ChatBox className="h-full w-full" />
                    </div>
                </div>
            </div>
            <Dialog open={gameOver} data-cy="game-over-dialog">
                <DialogContent hideClose>
                    <DialogHeader>
                        <DialogTitle>Game Over</DialogTitle>
                        <DialogDescription data-cy="game-over-message">
                            {winner === Winner.WHITE && 'White wins'}
                            {winner === Winner.BLACK && 'Black wins'}
                            {winner === Winner.DRAW && 'Draw'}
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
