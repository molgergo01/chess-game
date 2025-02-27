'use client';

import { Chessboard } from 'react-chessboard';
import { socket } from '@/lib/socket/socket.io';
import { Piece, Square } from 'react-chessboard/dist/chessboard/types';
import React, { useState } from 'react';

export default function Game({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const [boardPosition, setBoardPosition] = useState<string>('start');
    return (
        <div className={className} {...props}>
            <Chessboard
                position={boardPosition}
                onPieceDrop={onDrop(setBoardPosition)}
                animationDuration={0}
            />
        </div>
    );
}

function onDrop(
    setBoardPosition: React.Dispatch<React.SetStateAction<string>>
) {
    return function (
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
                console.log(response.position);
                setBoardPosition(response.position);
            });

        return true;
    };
}
