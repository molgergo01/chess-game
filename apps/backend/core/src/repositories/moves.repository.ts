import db from 'chess-game-backend-common/config/db';
import { injectable } from 'inversify';
import { Move } from '../models/move';
import { getDbConnection } from 'chess-game-backend-common/transaction/db-helper';

@injectable()
class MovesRepository {
    async save(move: Move) {
        const connection = getDbConnection(db);
        const sql = 'INSERT INTO chess_game.moves VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
        await connection.none(sql, [
            move.id,
            move.gameId,
            move.moveNumber,
            move.playerColor,
            move.moveNotation,
            move.positionFen,
            move.whitePlayerTime,
            move.blackPlayerTime,
            move.createdAt
        ]);
        console.log('Successfully created move in DB:', move);
    }
}

export default MovesRepository;
