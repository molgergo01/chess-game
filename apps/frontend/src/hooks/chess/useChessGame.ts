import { useCallback, useEffect, useState } from 'react';
import Fen from 'chess-fen';
import { isPromotion, updatePosition } from '@/lib/utils/fen.utils';
import { getPosition, movePiece, resetGame } from '@/lib/clients/game.client';
import { Winner } from '@/lib/models/response/game';
import { PieceDropHandlerArgs } from 'react-chessboard';

export function useChessGame() {
    const [boardPosition, setBoardPosition] = useState<Fen>(
        new Fen(Fen.emptyPosition)
    );
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<Winner | null>(null);

    useEffect(() => {
        const initializePosition = async () => {
            const response = await getPosition();
            setBoardPosition(new Fen(response.position));
            if (response.gameOver) {
                setGameOver(true);
                setWinner(response.winner);
            }
        };
        initializePosition();
    }, []);

    const onDrop = useCallback(
        ({
            sourceSquare,
            targetSquare,
            piece
        }: PieceDropHandlerArgs): boolean => {
            if (targetSquare === null) return false;
            const updatedPosition = updatePosition(
                boardPosition,
                sourceSquare,
                targetSquare,
                piece
            );
            setBoardPosition(updatedPosition);

            let promotionPiece: string | undefined;
            const color = piece.pieceType.charAt(0);
            const pieceType = piece.pieceType.charAt(1);
            const targetSquareNumber = targetSquare.charAt(1);
            if (isPromotion(pieceType, color, targetSquareNumber))
                promotionPiece = 'q';

            movePiece(sourceSquare, targetSquare, promotionPiece).then(
                (response) => {
                    if (
                        !response.success ||
                        response.position !== updatedPosition.toString()
                    ) {
                        setBoardPosition(new Fen(response.position));
                    }
                    if (response.gameOver) {
                        setGameOver(true);
                        setWinner(response.winner);
                    }
                }
            );
            return true;
        },
        [boardPosition]
    );

    const reset = useCallback(() => {
        resetGame();
        setBoardPosition(new Fen(Fen.startingPosition));
        setGameOver(false);
        setWinner(null);
    }, []);

    return {
        boardPosition,
        gameOver,
        winner,
        onDrop,
        reset
    };
}
