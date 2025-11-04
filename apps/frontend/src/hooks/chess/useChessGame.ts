import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Fen from 'chess-fen';
import { getTurnColor, isPromotion, updatePosition } from '@/lib/utils/fen.utils';
import { joinGame, movePiece } from '@/lib/clients/core.socket.client';
import { UserDto, Winner } from '@/lib/models/response/game';
import { PieceDropHandlerArgs } from 'react-chessboard';
import {
    DrawOffer,
    DrawOfferedMessage,
    GameUpdateMessage,
    PlayerTimes,
    RatingChange,
    TimeExpiredMessage
} from '@/lib/models/request/game';
import { getCurrentUserColor } from '@/lib/utils/game.utils';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { useAuth } from '@/hooks/auth/useAuth';
import { getActiveGame } from '@/lib/clients/core.rest.client';
import { toast } from 'sonner';
import { getErrorSeverity, SocketErrorPayload } from '@/lib/models/errors/socket-error';
import { getUserFriendlyErrorMessage } from '@/lib/utils/error-message.utils';

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
    const [drawOffer, setDrawOffer] = useState<DrawOffer | undefined>(undefined);
    const [timeUntilAbandoned, setTimeUntilAbandoned] = useState<number | null>(null);
    const [criticalError, setCriticalError] = useState<string | null>(null);
    const { socket } = useCoreSocket();
    const { userId } = useAuth();

    useEffect(() => {
        if (!socket) return;
        const handleUpdatePosition = (request: GameUpdateMessage) => {
            setBoardPosition(new Fen(request.position));
            setTimesRemaining(request.playerTimes);
            setTimeUntilAbandoned(null);
            if (request.isGameOver) {
                setGameOver(true);
                setWinner(request.winner);
                setRatingChange(request.ratingChange);
            }
        };
        const handleGameOver = (request: TimeExpiredMessage) => {
            setGameOver(true);
            setWinner(request.winner);
            setRatingChange(request.ratingChange);
        };

        const handleDrawOffered = (request: DrawOfferedMessage) => {
            const drawOffer: DrawOffer = {
                offeredBy: request.offeredBy,
                expiresAt: new Date(request.expiresAt)
            };
            setDrawOffer(drawOffer);
        };

        const handleDrawOfferRejected = () => {
            setDrawOffer(undefined);
        };

        const handleGameError = (error: SocketErrorPayload) => {
            const friendlyMessage = getUserFriendlyErrorMessage(error.message, error.code, 'game');
            const severity = getErrorSeverity(error.code);

            if (severity === 'alert') {
                setCriticalError(friendlyMessage);
            } else {
                toast.error(friendlyMessage);
            }
        };

        socket.on('update-position', handleUpdatePosition);
        socket.on('game-over', handleGameOver);
        socket.on('draw-offered', handleDrawOffered);
        socket.on('draw-offer-rejected', handleDrawOfferRejected);
        socket.on('game-error', handleGameError);

        return () => {
            socket.off('update-position', handleUpdatePosition);
            socket.off('game-over', handleGameOver);
            socket.off('draw-offered', handleDrawOffered);
            socket.off('draw-offer-rejected', handleDrawOfferRejected);
            socket.off('game-error', handleGameError);
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
                setDrawOffer(gameData.drawOffer);
                setTimeUntilAbandoned(gameData.timeUntilAbandoned);

                if (gameData.gameOver) {
                    setGameId(undefined);
                } else {
                    joinGame(socket, gameData.gameId);
                }
            } catch (error) {
                if (error instanceof Error && 'status' in error && error.status === 404) {
                    toast.error('Game not found');
                    router.push('/play');
                } else {
                    toast.error('Failed to load game');
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

    useEffect(() => {
        if (!drawOffer) return;

        const now = Date.now();
        const expiresAt = drawOffer.expiresAt.getTime();
        const timeUntilExpiry = expiresAt - now;

        if (timeUntilExpiry <= 0) {
            setDrawOffer(undefined);
            return;
        }

        const timeoutId = setTimeout(() => {
            setDrawOffer(undefined);
        }, timeUntilExpiry);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [drawOffer]);

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
        ratingChange,
        gameId,
        drawOffer,
        timeUntilAbandoned,
        criticalError,
        clearCriticalError: () => setCriticalError(null)
    };
}

export default useChessGame;
