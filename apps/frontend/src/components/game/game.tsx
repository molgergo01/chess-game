'use client';

import { Chessboard } from 'react-chessboard';
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
import Banner from '@/components/game/banner/banner';
import Timer, { TimerRef } from '@/components/game/banner/timer';
import { Color } from '@/lib/models/request/matchmaking';
import NavBar from '@/components/layout/navbar';

function Game({ className, ...props }: React.ComponentProps<'div'>) {
    const router = useRouter();
    const { color, boardPosition, turnColor, timesRemaining, gameOver, winner, onDrop } = useChessGame();

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

        if (turnColor === Color.WHITE) {
            whiteTimerRef.current?.start();
        } else if (turnColor === Color.BLACK) {
            blackTimerRef.current?.start();
        }
    }, [turnColor, gameStarted, gameOver, timesRemaining]);

    useEffect(() => {
        if (gameOver) {
            whiteTimerRef.current?.stop();
            blackTimerRef.current?.stop();
        }
    }, [gameOver]);

    const chessboardOptions = {
        position: boardPosition.toString(),
        boardOrientation: color,
        onPieceDrop: onDrop,
        animationDurationInMs: 0
    };

    const handleReset = () => {
        router.push('/play');
    };

    return (
        <div className={`flex flex-col flex-1 min-h-0 ${className}`} data-cy="game-container" {...props}>
            <Timer ref={whiteTimerRef} timeInMinutes={10} onTick={handleWhiteTimerTick} />
            <Timer ref={blackTimerRef} timeInMinutes={10} onTick={handleBlackTimerTick} />

            <div className="flex-grow-0 grid grid-cols-2 sm:hidden" data-cy="game-mobile-banners">
                <Banner
                    className="rounded-r-3xl"
                    playerName={'joe biden'}
                    playerColor={color === Color.WHITE ? Color.WHITE : Color.BLACK}
                    isOpponent={false}
                    turnColor={turnColor}
                    timeLeft={color === Color.WHITE ? whiteTimeLeft : blackTimeLeft}
                />
                <Banner
                    className="rounded-l-3xl"
                    playerName={'donald trump'}
                    playerColor={color === Color.WHITE ? Color.BLACK : Color.WHITE}
                    isOpponent={true}
                    turnColor={turnColor}
                    timeLeft={color === Color.WHITE ? blackTimeLeft : whiteTimeLeft}
                />
            </div>

            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto sm:overflow-visible sm:items-center sm:justify-center sm:p-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full h-full min-h-0 sm:w-auto sm:h-auto sm:max-h-[min(700px,calc(100vh-7rem))] lg:max-h-[min(850px,calc(100vh-7rem))] aspect-square sm:gap-2">
                    <div className="flex flex-col sm:gap-1 flex-shrink-0">
                        <Banner
                            className="hidden sm:flex flex-col sm:w-[min(500px,min(45vw,calc(100vh-12rem)))] lg:w-[min(650px,min(50vw,calc(100vh-10rem)))] sm:rounded-lg sm:border-2 sm:border-border sm:overflow-hidden"
                            playerColor={color === Color.WHITE ? Color.BLACK : Color.WHITE}
                            isOpponent={true}
                            turnColor={turnColor}
                            timeLeft={color === Color.WHITE ? blackTimeLeft : whiteTimeLeft}
                            data-cy="game-desktop-banner-top"
                        />

                        <div
                            className="w-full max-w-[min(100vw,calc(100vh-22rem))] aspect-square mx-auto flex-shrink-0 sm:w-[min(500px,min(45vw,calc(100vh-12rem)))] sm:h-[min(500px,min(45vw,calc(100vh-12rem)))] lg:w-[min(650px,min(50vw,calc(100vh-10rem)))] lg:h-[min(650px,min(50vw,calc(100vh-10rem)))] sm:max-w-none sm:aspect-auto"
                            data-cy="game-chessboard-container"
                        >
                            <Chessboard options={chessboardOptions} />
                        </div>

                        <Banner
                            className="hidden sm:flex flex-col sm:w-[min(500px,min(45vw,calc(100vh-12rem)))] lg:w-[min(650px,min(50vw,calc(100vh-10rem)))] sm:rounded-lg sm:border-2 sm:border-border sm:overflow-hidden"
                            playerColor={color === Color.WHITE ? Color.WHITE : Color.BLACK}
                            isOpponent={false}
                            turnColor={turnColor}
                            timeLeft={color === Color.WHITE ? whiteTimeLeft : blackTimeLeft}
                            data-cy="game-desktop-banner-bottom"
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

            <div className="sm:hidden mt-auto flex-shrink-0" data-cy="game-navbar">
                <NavBar />
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
