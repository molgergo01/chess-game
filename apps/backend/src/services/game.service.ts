import { Chess } from 'chess.js';

const game = new Chess();

export function move(gameId: string, from: string, to: string) {
    game.move({ from: from, to: to });
    console.log(`Game: ${gameId}`);
    console.log(game.ascii());
}
