'use client';

import { Chessboard } from 'react-chessboard';
import React from 'react';
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
import { useChessGame } from '@/hooks/chess/useChessGame';

export default function Game({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const { boardPosition, gameOver, winner, onDrop, reset } = useChessGame();

    const chessboardOptions = {
        position: boardPosition.toString(),
        onPieceDrop: onDrop,
        animationDurationInMs: 0
    };

    return (
        <div className={className} {...props}>
            <Chessboard options={chessboardOptions} />
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
                        <DialogClose onClick={reset}>Confirm</DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
