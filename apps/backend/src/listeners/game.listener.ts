import {
    getFen,
    getWinner,
    isGameOver,
    move,
    reset
} from '../services/game.service';
import {
    MoveCallback,
    MoveRequest,
    PositionCallback,
    PositionRequest
} from '../models/game';

const gameListener = () => {
    const movePiece = function (moveData: MoveRequest, callback: MoveCallback) {
        let fen = getFen();
        try {
            fen = move(
                moveData.gameId,
                moveData.from,
                moveData.to,
                moveData.promotionPiece
            );
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
        positionData: PositionRequest,
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
