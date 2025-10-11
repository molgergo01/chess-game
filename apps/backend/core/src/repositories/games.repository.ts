import db from 'chess-game-backend-common/config/db';
import { injectable } from 'inversify';
import { Game, GameWithMoves, GameWithPlayers } from '../models/game';
import { GameEntity, MoveEntity } from '../models/entities';
import { User } from '../models/user';

@injectable()
class GamesRepository {
    async findById(id: string): Promise<Game | null> {
        const sql = 'SELECT * FROM chess_game.games WHERE id = $1';
        const result: Array<GameEntity> = await db.query(sql, [id]);
        if (result.length == 0) {
            return null;
        }
        const row = result[0];
        return {
            id: row.id,
            whitePlayerId: row.white_player_id,
            blackPlayerId: row.black_player_id,
            startedAt: row.started_at,
            endedAt: row.ended_at,
            winner: row.winner
        } as Game;
    }

    async findAllByUserId(
        userId: string,
        limit: number | null,
        offset: number | null
    ): Promise<Array<GameWithPlayers>> {
        let sql = `
            SELECT g.*,
                   wU.id    as white_user_id,
                   wU.name  as white_user_name,
                   wU.email as white_user_email,
                   wU.elo   as white_user_elo,
                   bU.id    as black_user_id,
                   bU.name  as black_user_name,
                   bU.email as black_user_email,
                   bU.elo   as black_user_elo
            FROM chess_game.games g
                     LEFT JOIN chess_game.users wU ON g.white_player_id = wU.id
                     LEFT JOIN chess_game.users bU ON g.black_player_id = bU.id
            WHERE (g.black_player_id = $1 OR g.white_player_id = $1) AND g.ended_at IS NOT NULL AND g.winner IS NOT NULL
            ORDER BY g.ended_at DESC
        `;
        const params: (string | number)[] = [userId];

        if (limit !== null) {
            params.push(limit);
            sql += ` LIMIT $${params.length}`;
        }

        if (offset !== null) {
            params.push(offset);
            sql += ` OFFSET $${params.length}`;
        }

        const result: Array<
            GameEntity & {
                white_user_id: string;
                white_user_name: string;
                white_user_email: string;
                white_user_elo: number;
                black_user_id: string;
                black_user_name: string;
                black_user_email: string;
                black_user_elo: number;
            }
        > = await db.query(sql, params);

        return result.map((row) => {
            if (!row.ended_at || !row.winner) {
                throw new Error('Game is still in progress');
            }
            const whitePlayer: User = {
                id: row.white_user_id,
                name: row.white_user_name,
                email: row.white_user_email,
                elo: row.white_user_elo
            };
            const blackPlayer: User = {
                id: row.black_user_id,
                name: row.black_user_name,
                email: row.black_user_email,
                elo: row.black_user_elo
            };
            return {
                id: row.id,
                whitePlayer: whitePlayer,
                blackPlayer: blackPlayer,
                startedAt: row.started_at,
                endedAt: row.ended_at,
                winner: row.winner
            };
        });
    }

    async findByIdWithMoves(id: string): Promise<GameWithMoves | null> {
        const sql = `
            SELECT g.*,
                   wU.id        as white_user_id,
                   wU.name      as white_user_name,
                   wU.email     as white_user_email,
                   wU.elo       as white_user_elo,
                   bU.id        as black_user_id,
                   bU.name      as black_user_name,
                   bU.email     as black_user_email,
                   bU.elo       as black_user_elo,
                   m.id         as move_id,
                   m.move_number,
                   m.player_color,
                   m.move_notation,
                   m.position_fen,
                   m.white_player_time,
                   m.black_player_time,
                   m.created_at as move_created_at
            FROM chess_game.games g
                     LEFT JOIN chess_game.moves m ON g.id = m.game_id
                     LEFT JOIN chess_game.users wU ON g.white_player_id = wU.id
                     LEFT JOIN Chess_game.users bU ON g.black_player_id = bU.id
            WHERE g.id = $1
            ORDER BY m.move_number
        `;

        const result: Array<
            MoveEntity &
                GameEntity & {
                    move_id: string | null;
                    move_created_at: Date;
                    white_user_id: string;
                    white_user_name: string;
                    white_user_email: string;
                    white_user_elo: number;
                    black_user_id: string;
                    black_user_name: string;
                    black_user_email: string;
                    black_user_elo: number;
                }
        > = await db.query(sql, [id]);

        if (result.length === 0) {
            return null;
        }

        const firstRow = result[0];
        const whitePlayer: User = {
            id: firstRow.white_user_id,
            name: firstRow.white_user_name,
            email: firstRow.white_user_email,
            elo: firstRow.white_user_elo
        };
        const blackPlayer: User = {
            id: firstRow.black_user_id,
            name: firstRow.black_user_name,
            email: firstRow.black_user_email,
            elo: firstRow.black_user_elo
        };
        const game: GameWithPlayers = {
            id: firstRow.id,
            whitePlayer: whitePlayer,
            blackPlayer: blackPlayer,
            startedAt: firstRow.started_at,
            endedAt: firstRow.ended_at,
            winner: firstRow.winner
        };

        const moves = result
            .filter((row) => row.move_id !== null)
            .map((row) => ({
                id: row.move_id as string,
                gameId: id,
                moveNumber: row.move_number,
                playerColor: row.player_color,
                moveNotation: row.move_notation,
                positionFen: row.position_fen,
                whitePlayerTime: row.white_player_time,
                blackPlayerTime: row.black_player_time,
                createdAt: row.move_created_at
            }));

        return {
            ...game,
            moves
        };
    }

    async countAllByUserId(userId: string): Promise<number> {
        const sql = `SELECT COUNT(*) FROM chess_game.games WHERE (black_player_id = $1 OR white_player_id = $1) AND ended_at IS NOT NULL`;
        const result = await db.query(sql, [userId]);
        return Number(result[0].count);
    }

    async save(game: Game) {
        const sql = 'INSERT INTO chess_game.games VALUES ($1, $2, $3, $4, $5, $6)';
        await db.none(sql, [
            game.id,
            game.whitePlayerId,
            game.blackPlayerId,
            game.startedAt,
            game.endedAt,
            game.winner
        ]);
        console.log('Successfully created game in DB:', game);
    }

    async update(game: Game) {
        const sql = `
            UPDATE chess_game.games
            SET 
                white_player_id = $2,
                black_player_id = $3,
                started_at = $4,
                ended_at = $5,
                winner = $6
            WHERE id = $1
        `;

        await db.none(sql, [
            game.id,
            game.whitePlayerId,
            game.blackPlayerId,
            game.startedAt,
            game.endedAt,
            game.winner
        ]);
        console.log('Successfully updated game in DB:', game);
    }
}

export default GamesRepository;
