import { useCallback, useEffect, useState } from 'react';
import Fen from 'chess-fen';
import { getTurnColor, isPromotion, updatePosition } from '@/lib/utils/fen.utils';
import { getPosition, getTimes, movePiece } from '@/lib/clients/core.socket.client';
import { Winner } from '@/lib/models/response/game';
import { PieceDropHandlerArgs } from 'react-chessboard';
import { GameUpdateMessage, PlayerTimes, TimeExpiredMessage } from '@/lib/models/request/game';
import { getCurrentUserColor } from '@/lib/utils/game.utils';
import { Color } from '@/lib/models/request/matchmaking';
import useGameId from '@/hooks/chess/useGameId';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { useAuth } from '@/hooks/auth/useAuth';

function useChessGame() {
    const [gameId, setGameId] = useGameId();
    const [boardPosition, setBoardPosition] = useState<Fen>(new Fen(Fen.emptyPosition));
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<Winner | null>(null);
    const [color, setColor] = useState<Color | undefined>(undefined);
    const [turnColor, setTurnColor] = useState<Color | undefined>(undefined);
    const [timesRemaining, setTimesRemaining] = useState<PlayerTimes | undefined>(undefined);
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
        const handleUpdatePosition = (request: GameUpdateMessage) => {
            setBoardPosition(new Fen(request.position));
            setTimesRemaining(request.playerTimes);
            if (request.isGameOver) {
                setGameOver(true);
                setWinner(request.winner);
            }
        };
        const handleTimeExpired = (request: TimeExpiredMessage) => {
            setGameOver(true);
            setWinner(request.winner);
            setTimesRemaining({
                blackTimeRemaining: 0,
                whiteTimeRemaining: 0
            });
        };
        socket.on('update-position', handleUpdatePosition);
        socket.on('time-expired', handleTimeExpired);

        return () => {
            socket.off('update-position', handleUpdatePosition);
            socket.off('time-expired', handleTimeExpired);
        };
    }, [socket]);

    useEffect(() => {
        if (!userId) return;
        setColor(getCurrentUserColor(userId));
    }, [userId]);

    useEffect(() => {
        setTurnColor(getTurnColor(boardPosition));
    }, [boardPosition]);

    useEffect(() => {
        if (!socket || !gameId) return;
        const initializeTimers = async () => {
            const response = await getTimes(socket, gameId);

            setTimesRemaining({
                blackTimeRemaining: response.playerTimes.blackTimeRemaining,
                whiteTimeRemaining: response.playerTimes.whiteTimeRemaining
            });
        };

        initializeTimers();
    }, [socket, gameId]);

    const onDrop = useCallback(
        ({ sourceSquare, targetSquare, piece }: PieceDropHandlerArgs): boolean => {
            if (!gameId || !userId || !socket) return false;
            if (targetSquare === null) return false;
            const updatedPosition = updatePosition(boardPosition, sourceSquare, targetSquare, piece);
            setBoardPosition(updatedPosition);

            let promotionPiece: string | undefined;
            const color = piece.pieceType.charAt(0);
            const pieceType = piece.pieceType.charAt(1);
            const targetSquareNumber = targetSquare.charAt(1);
            if (isPromotion(pieceType, color, targetSquareNumber)) promotionPiece = 'q';

            movePiece(socket, gameId, sourceSquare, targetSquare, promotionPiece).then((response) => {
                if (!response.success || response.position !== updatedPosition.toString()) {
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
        timesRemaining,
        gameOver,
        winner,
        onDrop
    };
}

export default useChessGame;
