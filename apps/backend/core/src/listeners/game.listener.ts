import GameService from '../services/game.service';
import { Server, Socket } from 'socket.io';
import container from '../config/container';
import GameNotificationService from '../services/game.notification.service';
import { MoveCallback } from '../models/callbacks';
import {
    JoinGameRequest,
    MoveRequest,
    OfferDrawRequest,
    ResignRequest,
    RespondDrawOfferRequest
} from '../models/requests';
import { RatingChange, Winner } from '../models/game';
import ChatService from '../services/chat.service';
import ChatNotificationService from '../services/chat.notification.service';
import { getColorString } from '../utils/color.utils';
import { handleCoreSocketError } from '../middlewares/core.socket.error.handler';

const gameService = container.get(GameService);
const gameNotificationService = container.get(GameNotificationService);
const chatService = container.get(ChatService);
const chatNotificationService = container.get(ChatNotificationService);

const gameListener = (io: Server, socket: Socket) => {
    const joinGame = function (request: JoinGameRequest) {
        try {
            socket.join(request.gameId);
        } catch (error) {
            handleCoreSocketError(
                io,
                socket,
                error as Error,
                {
                    operation: 'joinGame',
                    userId: socket.data.user?.id,
                    gameId: request.gameId
                },
                'game-error'
            );
        }
    };

    const movePiece = async function (request: MoveRequest, callback: MoveCallback) {
        try {
            const requestTimestamp = Date.now();
            let fen = await gameService.getFen(request.gameId);
            try {
                fen = await gameService.move(
                    socket.data.user!.id,
                    request.gameId,
                    request.from,
                    request.to,
                    request.promotionPiece,
                    requestTimestamp
                );
                callback({
                    success: true,
                    position: fen
                });
            } catch (error) {
                handleCoreSocketError(
                    io,
                    socket,
                    error as Error,
                    {
                        operation: 'movePiece',
                        userId: socket.data.user?.id,
                        gameId: request.gameId,
                        from: request.from,
                        to: request.to
                    },
                    'game-error'
                );
                callback({
                    success: false,
                    position: fen
                });
                return;
            }
            const isGameOver = await gameService.isGameOver(request.gameId);
            const winner = await gameService.getWinner(request.gameId);
            const playerTimes = await gameService.getTimes(request.gameId);
            let ratingChange: RatingChange | null = null;
            if (isGameOver) {
                ratingChange = await gameService.reset(request.gameId);
            }
            gameNotificationService.sendPositionUpdateNotification(
                request.gameId,
                fen,
                isGameOver,
                winner,
                playerTimes,
                ratingChange
            );
        } catch (error) {
            handleCoreSocketError(
                io,
                socket,
                error as Error,
                {
                    operation: 'movePiece',
                    userId: socket.data.user?.id,
                    gameId: request.gameId
                },
                'game-error'
            );
        }
    };

    const resign = async function (request: ResignRequest) {
        try {
            const playercolor = await gameService.getPlayerColor(request.gameId, socket.data.user!.id);
            const message = `${getColorString(playercolor)} resigned`;
            await logInChatMessage(request.gameId, message, socket.data.user!.id);

            const result = await gameService.resign(socket.data.user!.id, request.gameId);

            gameNotificationService.sendGameOverNotification(request.gameId, result.winner, result.ratingChange);
        } catch (error) {
            handleCoreSocketError(
                io,
                socket,
                error as Error,
                {
                    operation: 'resign',
                    userId: socket.data.user?.id,
                    gameId: request.gameId
                },
                'game-error'
            );
        }
    };

    const offerDraw = async function (request: OfferDrawRequest) {
        try {
            const playercolor = await gameService.getPlayerColor(request.gameId, socket.data.user!.id);
            const message = `${getColorString(playercolor)} offered a draw`;
            await logInChatMessage(request.gameId, message, socket.data.user!.id);

            const drawOffer = await gameService.offerDraw(request.gameId, socket.data.user!.id);

            gameNotificationService.sendDrawOfferedNotification(
                request.gameId,
                drawOffer.offeredBy,
                drawOffer.expiresAt
            );
        } catch (error) {
            handleCoreSocketError(
                io,
                socket,
                error as Error,
                {
                    operation: 'offerDraw',
                    userId: socket.data.user?.id,
                    gameId: request.gameId
                },
                'game-error'
            );
        }
    };

    const respondDrawOffer = async function (request: RespondDrawOfferRequest) {
        try {
            const playercolor = await gameService.getPlayerColor(request.gameId, socket.data.user!.id);
            const message = `${getColorString(playercolor)} ${request.accepted ? 'accepted' : 'declined'} the draw request`;
            await logInChatMessage(request.gameId, message, socket.data.user!.id);

            const ratingChange = await gameService.respondDrawOffer(
                request.gameId,
                socket.data.user!.id,
                request.accepted
            );
            if (ratingChange) {
                gameNotificationService.sendGameOverNotification(request.gameId, Winner.DRAW, ratingChange);
            } else {
                gameNotificationService.sendDrawOfferRejectedNotification(request.gameId);
            }
        } catch (error) {
            handleCoreSocketError(
                io,
                socket,
                error as Error,
                {
                    operation: 'respondDrawOffer',
                    userId: socket.data.user?.id,
                    gameId: request.gameId,
                    accepted: request.accepted
                },
                'game-error'
            );
        }
    };

    const logInChatMessage = async function (gameId: string, message: string, userId: string) {
        await chatService.createSystemChatMessage(gameId, message);
        const messages = await chatService.getChatMessages(gameId, userId);
        chatNotificationService.sendChatMessagesUpdatedNotification(gameId, messages);
    };

    return {
        joinGame,
        movePiece,
        resign,
        offerDraw,
        respondDrawOffer
    };
};

export default gameListener;
