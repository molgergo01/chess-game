import { useCallback, useEffect, useState } from 'react';
import Fen from 'chess-fen';
import {
    getTurnColor,
    isPromotion,
    updatePosition
} from '@/lib/utils/fen.utils';
import { getPosition, movePiece } from '@/lib/clients/core.socket.client';
import { Winner } from '@/lib/models/response/game';
import { PieceDropHandlerArgs } from 'react-chessboard';
import { UpdatePositionRequest } from '@/lib/models/request/game';
import { getCurrentUserColor } from '@/lib/utils/game.utils';
import { Color } from '@/lib/models/request/matchmaking';
import useGameId from '@/hooks/chess/useGameId';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { useAuth } from '@/hooks/auth/useAuth';

function useChessGame() {
    const [gameId, setGameId] = useGameId();
    const [boardPosition, setBoardPosition] = useState<Fen>(
        new Fen(Fen.emptyPosition)
    );
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<Winner | null>(null);
    const [color, setColor] = useState<Color | undefined>(undefined);
    const [turnColor, setTurnColor] = useState<Color | undefined>(undefined);
    const { socket } = useCoreSocket();
    const { userId } = useAuth();

    useEffect(() => {
        if (!gameId || !socket) return;
        const initializePosition = async () => {
            const response = await getPosition(socket, gameId);
            setBoardPosition(new Fen(response.position));
            if (response.gameOver) {
                setGameOver(true);
                setWinner(response.winner);
                setGameId(undefined);
            }
        };
        initializePosition();
    }, [gameId, socket, setGameId]);

    useEffect(() => {
        if (!socket) return;
        const handleUpdatePosition = (request: UpdatePositionRequest) => {
            setBoardPosition(new Fen(request.position));
            if (request.isGameOver) {
                setGameOver(true);
                setWinner(request.winner);
            }
        };
        socket.on('updatePosition', handleUpdatePosition);

        return () => {
            socket.off('updatePosition', handleUpdatePosition);
        };
    }, [socket]);

    useEffect(() => {
        if (!userId) return;
        setColor(getCurrentUserColor(userId));
    }, [userId]);

    useEffect(() => {
        setTurnColor(getTurnColor(boardPosition));
    }, [boardPosition]);

    const onDrop = useCallback(
        ({
            sourceSquare,
            targetSquare,
            piece
        }: PieceDropHandlerArgs): boolean => {
            if (!gameId || !userId || !socket) return false;
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

            movePiece(
                socket,
                gameId,
                sourceSquare,
                targetSquare,
                promotionPiece
            ).then((response) => {
                if (
                    !response.success ||
                    response.position !== updatedPosition.toString()
                ) {
                    setBoardPosition(new Fen(response.position));
                }
            });
            return true;
        },
        [boardPosition, gameId, userId, socket]
    );

    return {
        color,
        boardPosition,
        turnColor,
        gameOver,
        winner,
        onDrop
    };
}

export default useChessGame;
