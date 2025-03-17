'use client';

import { Chessboard } from 'react-chessboard';
import Fen, { BOARD_CONTENT, BoardContent } from 'chess-fen';
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
    const [boardPosition, setBoardPosition] = useState<Fen>(
        new Fen(Fen.emptyPosition)
    );
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<'w' | 'b' | 'd' | null>(null);

    useEffect(() => {
        const initializePosition = async () => {
            const response = await socket.emitWithAck('getPosition', {
                gameId: '1'
            });
            setBoardPosition(Fen.from(response.position));
            if (response.gameOver) {
                setGameOver(true);
                setWinner(response.winner);
            }
        };

        initializePosition();
    }, []);

    return (
        <div className={className} {...props}>
            <Chessboard
                position={boardPosition.toString()}
                onPieceDrop={onDrop}
                animationDuration={0}
            />

            <Dialog open={gameOver}>
                <DialogContent hideClose>
                    <DialogHeader>
                        <DialogTitle>Game Over</DialogTitle>
                        <DialogDescription>
                            {winner === 'w' && 'White wins'}
                            {winner === 'b' && 'Black wins'}
                            {winner === 'd' && 'Draw'}
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
        const updatedPosition = boardPosition
            .update(sourceSquare, BOARD_CONTENT[' '])
            .update(targetSquare, mapPieceToBoardContent(piece));
        setBoardPosition(updatedPosition);

        socket
            .emitWithAck('movePiece', {
                from: sourceSquare,
                to: targetSquare,
                gameId: '1'
            })
            .then((response) => {
                if (!response.success) {
                    setBoardPosition(Fen.from(response.position));
                }
                if (response.gameOver) {
                    setGameOver(response.gameOver);
                    setWinner(response.winner);
                }
            });

        return true;
    }

    function resetGame() {
        socket.emit('resetGame');
        setBoardPosition(new Fen(Fen.startingPosition));
        setGameOver(false);
        setWinner(null);
    }

    function mapPieceToBoardContent(piece: Piece): BoardContent {
        const color: string = piece.toString().charAt(0);
        const pieceType: string = piece.toString().charAt(1);

        const contentString =
            color === 'w' ? pieceType.toUpperCase() : pieceType.toLowerCase();

        return contentString as BoardContent;
    }
}
