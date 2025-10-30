import GameService from '../services/game.service';
import { Server, Socket } from 'socket.io';
import container from '../config/container';
import GameNotificationService from '../services/game.notification.service';
import { MoveCallback } from '../models/callbacks';
import { JoinGameRequest, MoveRequest } from '../models/requests';
import { RatingChange } from '../models/game';

const gameService = container.get(GameService);
const gameNotificationService = container.get(GameNotificationService);

const gameListener = (io: Server, socket: Socket) => {
    const joinGame = function (request: JoinGameRequest) {
        socket.join(request.gameId);
    };

    const movePiece = async function (request: MoveRequest, callback: MoveCallback) {
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
        } catch (error) {
            console.error(error);
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
    };

    return {
        joinGame,
        movePiece
    };
};

export default gameListener;
