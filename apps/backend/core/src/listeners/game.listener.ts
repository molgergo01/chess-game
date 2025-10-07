import GameService from '../services/game.service';
import {
    GetGameIdCallback,
    GetTimesCallback,
    GetTimesRequest,
    JoinGameRequest,
    MoveCallback,
    MoveRequest,
    PositionCallback,
    PositionRequest
} from '../models/game';
import { Server, Socket } from 'socket.io';
import container from '../config/container';
import GameNotificationService from '../services/game.notification.service';

const gameService = container.get(GameService);
const gameNotificationService = container.get(GameNotificationService);

const gameListener = (io: Server, socket: Socket) => {
    const getGameId = async function (callback: GetGameIdCallback) {
        const gameId = await gameService.getGameId(socket.handshake.auth.userId);
        callback({ gameId: gameId });
    };

    const getTimes = async function (request: GetTimesRequest, callback: GetTimesCallback) {
        const requestTimestamp = Date.now();
        const playerTimes = await gameService.getTimes(request.gameId, requestTimestamp);

        callback({
            playerTimes: playerTimes
        });
    };

    const joinGame = function (request: JoinGameRequest) {
        socket.join(request.gameId);
    };

    const movePiece = async function (request: MoveRequest, callback: MoveCallback) {
        const requestTimestamp = Date.now();
        let fen = await gameService.getFen(request.gameId);
        try {
            fen = await gameService.move(
                socket.handshake.auth.userId,
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
        if (isGameOver) {
            await gameService.reset(request.gameId);
        }
        gameNotificationService.sendPositionUpdateNotification(request.gameId, fen, isGameOver, winner, playerTimes);
    };

    const getPosition = async function (request: PositionRequest, callback: PositionCallback) {
        const fen = await gameService.getFen(request.gameId);
        const isGameOver = await gameService.isGameOver(request.gameId);
        const callbackBody = {
            position: fen,
            winner: await gameService.getWinner(request.gameId),
            gameOver: isGameOver
        };
        if (isGameOver) {
            await gameService.reset(request.gameId);
        }
        callback(callbackBody);
    };

    return {
        getGameId,
        getTimes,
        joinGame,
        movePiece,
        getPosition
    };
};

export default gameListener;
