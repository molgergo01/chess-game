'use client';

import { Chessboard } from 'react-chessboard';
import { useRouter } from 'next/navigation';
import React from 'react';
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

function Game({ className, ...props }: React.ComponentProps<'div'>) {
    const router = useRouter();
    const { color, boardPosition, turnColor, gameOver, winner, onDrop } =
        useChessGame();

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
        <div className={className} {...props}>
            <div>badge1</div>
            <div className="flex flex-col md:grid md:grid-rows-1 md:grid-cols-7 md:gap-4">
                <div className="hidden md:block md:col-span-1" />
                <div className="md:col-span-5 flex flex-col md:flex-row m-auto gap-2 h-full">
                    <div className="max-w-2xl max-h-2xl">
                        <Chessboard options={chessboardOptions} />
                    </div>
                    <div className="h-full w-full">
                        <ChatBox className="h-full w-full" />
                    </div>
                </div>
            </div>
            <div>badge2</div>

            <div className="text-center py-1 text-lg font-medium flex-shrink-0">
                {turnColor && `${turnColor}'s turn`}
            </div>
            <Dialog open={gameOver}>
                <DialogContent hideClose>
                    <DialogHeader>
                        <DialogTitle>Game Over</DialogTitle>
                        <DialogDescription>
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
