'use client';

import { Chessboard } from 'react-chessboard';
import { socket } from '@/lib/socket/socket.io';
import { Piece, Square } from 'react-chessboard/dist/chessboard/types';
import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';

export default function Game({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const [boardPosition, setBoardPosition] = useState<string>('');
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<string | null>(null);

    useEffect(() => {
        const initializePosition = async () => {
            const response = await socket.emitWithAck('getPosition', {
                gameId: '1'
            });
            setBoardPosition(response.position);
        };

        initializePosition();
    }, []);

    return (
        <div className={className} {...props}>
            <Chessboard
                position={boardPosition}
                onPieceDrop={onDrop}
                animationDuration={0}
            />

            <Dialog open={gameOver}>
                <DialogContent hideClose>
                    <DialogHeader>
                        <DialogTitle>Game Over</DialogTitle>
                        <DialogDescription>
                            {winner === 'w' && <p>White wins</p>}
                            {winner === 'b' && <p>Black wins</p>}
                            {winner === 'd' && <p>Draw</p>}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose onClick={resetGame}>Confirm</DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

    function onDrop(
        sourceSquare: Square,
        targetSquare: Square,
        piece: Piece
    ): boolean {
        console.log(
            `from: ${sourceSquare}, to: ${targetSquare}, piece: ${piece}`
        );

        socket
            .emitWithAck('movePiece', {
                from: sourceSquare,
                to: targetSquare,
                gameId: '1'
            })
            .then((response) => {
                setBoardPosition(response.position);
                setGameOver(response.gameOver);
                setWinner(response.winner);
                console.log(response);
            });

        return true;
    }

    function resetGame() {
        socket.emit('resetGame');
        setBoardPosition('start');
        setGameOver(false);
        setWinner(null);
    }
}
