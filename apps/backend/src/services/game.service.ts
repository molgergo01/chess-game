import { Chess } from 'chess.js';
import { Winner } from '../models/game';

const game = new Chess();

export function move(
    gameId: string,
    from: string,
    to: string,
    promotionPiece: string | undefined
): string {
    game.move({ from: from, to: to, promotion: promotionPiece });
    return game.fen();
}

export function getFen(): string {
    return game.fen();
}

export function isGameOver(): boolean {
    return game.isGameOver();
}

export function getWinner(): Winner | null {
    if (game.isDraw()) {
        return Winner.DRAW;
    } else if (game.isCheckmate()) {
        return game.turn() === 'w' ? Winner.BLACK : Winner.WHITE;
    }

    return null;
}

export function reset(): void {
    game.reset();
}
