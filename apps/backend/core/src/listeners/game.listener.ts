import GameService from '../services/game.service';
import {
    GetGameIdCallback,
    JoinGameRequest,
    MoveCallback,
    MoveRequest,
    PositionCallback,
    PositionRequest,
    UpdatePositionRequest
} from '../models/game';
import { Server, Socket } from 'socket.io';
import container from '../config/container';

const gameService = container.get(GameService);

const gameListener = (io: Server, socket: Socket) => {
    const getGameId = async function (callback: GetGameIdCallback) {
        const gameId = await gameService.getGameId(
            socket.handshake.auth.userId
        );
        callback({ gameId: gameId });
    };
    const joinGame = function (request: JoinGameRequest) {
        socket.join(request.gameId);
    };

    const movePiece = async function (
        request: MoveRequest,
        callback: MoveCallback
    ) {
        let fen = await gameService.getFen(request.gameId);
        try {
            fen = await gameService.move(
                socket.handshake.auth.userId,
                request.gameId,
                request.from,
                request.to,
                request.promotionPiece
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
        const requestBody: UpdatePositionRequest = {
            position: fen,
            isGameOver: isGameOver,
            winner: await gameService.getWinner(request.gameId)
        };
        if (isGameOver) {
            await gameService.reset(request.gameId);
        }
        io.to(request.gameId).emit('updatePosition', requestBody);
    };

    const getPosition = async function (
        request: PositionRequest,
        callback: PositionCallback
    ) {
        const fen = await gameService.getFen(request.gameId);
        callback({
            position: fen,
            winner: await gameService.getWinner(request.gameId),
            gameOver: await gameService.isGameOver(request.gameId)
        });
    };

    return {
        getGameId,
        joinGame,
        movePiece,
        getPosition
    };
};

export default gameListener;
