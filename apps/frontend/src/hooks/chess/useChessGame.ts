import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Fen from 'chess-fen';
import { getTurnColor, isPromotion, updatePosition } from '@/lib/utils/fen.utils';
import { joinGame, movePiece } from '@/lib/clients/core.socket.client';
import { UserDto, Winner } from '@/lib/models/response/game';
import { PieceDropHandlerArgs } from 'react-chessboard';
import { GameUpdateMessage, PlayerTimes, RatingChange, TimeExpiredMessage } from '@/lib/models/request/game';
import { getCurrentUserColor } from '@/lib/utils/game.utils';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { useAuth } from '@/hooks/auth/useAuth';
import { getActiveGame } from '@/lib/clients/core.rest.client';

function useChessGame() {
    const router = useRouter();
    const [gameId, setGameId] = useState<string | undefined>(undefined);
    const [boardPosition, setBoardPosition] = useState<Fen>(new Fen(Fen.emptyPosition));
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<Winner | null>(null);
    const [color, setColor] = useState<MatchmakingColor | undefined>(undefined);
    const [turnColor, setTurnColor] = useState<MatchmakingColor | undefined>(undefined);
    const [timesRemaining, setTimesRemaining] = useState<PlayerTimes | undefined>(undefined);
    const [whitePlayer, setWhitePlayer] = useState<UserDto | undefined>(undefined);
    const [blackPlayer, setBlackPlayer] = useState<UserDto | undefined>(undefined);
    const [ratingChange, setRatingChange] = useState<RatingChange | null>(null);
    const { socket } = useCoreSocket();
    const { userId } = useAuth();

    useEffect(() => {
        if (!socket) return;
        const handleUpdatePosition = (request: GameUpdateMessage) => {
            setBoardPosition(new Fen(request.position));
            setTimesRemaining(request.playerTimes);
            if (request.isGameOver) {
                setGameOver(true);
                setWinner(request.winner);
                setRatingChange(request.ratingChange);
            }
        };
        const handleTimeExpired = (request: TimeExpiredMessage) => {
            setGameOver(true);
            setWinner(request.winner);
            setTimesRemaining({
                blackTimeRemaining: 0,
                whiteTimeRemaining: 0
            });
            setRatingChange(request.ratingChange);
        };
        socket.on('update-position', handleUpdatePosition);
        socket.on('time-expired', handleTimeExpired);

        return () => {
            socket.off('update-position', handleUpdatePosition);
            socket.off('time-expired', handleTimeExpired);
        };
    }, [socket]);

    useEffect(() => {
        const fetchGameData = async () => {
            if (!socket) return;
            try {
                const gameData = await getActiveGame();
                setGameId(gameData.gameId);
                setWhitePlayer(gameData.whitePlayer);
                setBlackPlayer(gameData.blackPlayer);
                setBoardPosition(new Fen(gameData.position));
                setTimesRemaining({
                    whiteTimeRemaining: gameData.whiteTimeRemaining,
                    blackTimeRemaining: gameData.blackTimeRemaining
                });
                setGameOver(gameData.gameOver);
                setWinner(gameData.winner);

                if (gameData.gameOver) {
                    setGameId(undefined);
                } else {
                    joinGame(socket, gameData.gameId);
                }
            } catch (error) {
                if (error instanceof Error && 'status' in error && error.status === 404) {
                    router.push('/play');
                } else {
                    console.error('Failed to fetch game data:', error);
                    router.push('/play');
                }
            }
        };

        fetchGameData();
    }, [socket, router]);

    useEffect(() => {
        if (!userId || !whitePlayer || !blackPlayer) return;
        setColor(getCurrentUserColor(userId, whitePlayer, blackPlayer));
    }, [userId, whitePlayer, blackPlayer]);

    useEffect(() => {
        setTurnColor(getTurnColor(boardPosition));
    }, [boardPosition]);

    const onDrop = useCallback(
        ({ sourceSquare, targetSquare, piece }: PieceDropHandlerArgs): boolean => {
            if (!gameId || !socket) return false;
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
        [boardPosition, gameId, socket]
    );

    return {
        color,
        boardPosition,
        turnColor,
        timesRemaining,
        gameOver,
        winner,
        onDrop,
        whitePlayer,
        blackPlayer,
        ratingChange
    };
}

export default useChessGame;
