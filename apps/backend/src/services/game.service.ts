import { Chess } from 'chess.js';

const game = new Chess();

export function move(gameId: string, from: string, to: string): string {
    game.move({ from: from, to: to });
    console.log(`Game: ${gameId}`);
    console.log(game.ascii());
    console.log(game.fen());
    return game.fen();
}

export function getFen(): string {
    return game.fen();
}
