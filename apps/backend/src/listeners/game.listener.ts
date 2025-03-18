import { Server, Socket } from 'socket.io';
import {
    getFen,
    getWinner,
    isGameOver,
    move,
    reset
} from '../services/game.service';
import {
    MoveCallback,
    MoveData,
    PositionCallback,
    PositionData
} from '../models/game';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const gameListener = (io: Server, socket: Socket) => {
    const movePiece = function (moveData: MoveData, callback: MoveCallback) {
        let fen = getFen();
        try {
            fen = move(moveData.gameId, moveData.from, moveData.to);
        } catch (e) {
            console.log(e);
            callback({
                success: false,
                position: fen,
                gameOver: isGameOver(),
                winner: getWinner()
            });
            return;
        }
        callback({
            success: true,
            position: fen,
            gameOver: isGameOver(),
            winner: getWinner()
        });
    };

    const getPosition = function (
        positionData: PositionData,
        callback: PositionCallback
    ) {
        const fen = getFen();
        callback({
            position: fen,
            gameOver: isGameOver(),
            winner: getWinner()
        });
    };

    const resetGame = function () {
        reset();
    };

    return { movePiece, getPosition, resetGame };
};

export default gameListener;
