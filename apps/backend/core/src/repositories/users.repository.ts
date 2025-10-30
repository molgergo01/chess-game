import { injectable } from 'inversify';
import { LeaderboardUser } from '../models/user';
import { UserEntity } from '../models/entities';
import db from 'chess-game-backend-common/config/db';

@injectable()
class UsersRepository {
    async findAll(limit: number | undefined, offset: number | undefined): Promise<Array<LeaderboardUser>> {
        let sql = `
            SELECT *
            FROM (
                     SELECT
                         *,
                         ROW_NUMBER() OVER (ORDER BY elo DESC) as rank
                     FROM chess_game.users
                 ) ranked_users
            ORDER BY elo DESC
        `;

        const params: (string | number)[] = [];

        if (limit) {
            params.push(limit);
            sql += ` LIMIT $${params.length}`;
        }

        if (offset) {
            params.push(offset);
            sql += ` OFFSET $${params.length}`;
        }

        const result: Array<UserEntity & { rank: number }> = await db.query(sql, params);

        return result.map(
            (row): LeaderboardUser => ({
                id: row.id,
                name: row.name,
                rank: row.rank,
                elo: row.elo,
                avatarUrl: row.avatar_url
            })
        );
    }

    async countAll(): Promise<number> {
        const sql = `SELECT COUNT(*) FROM chess_game.users`;
        const result = await db.query(sql);
        return Number(result[0].count);
    }

    async findEloById(id: string): Promise<number> {
        const sql = `SELECT elo FROM chess_game.users WHERE id = $1 LIMIT 1`;
        const result = await db.query(sql, [id]);

        return Number(result[0].elo);
    }

    async updateEloById(id: string, elo: number) {
        const sql = `
            UPDATE chess_game.users
            SET elo = $2
            WHERE id = $1
        `;

        return db.none(sql, [id, elo]);
    }
}

export default UsersRepository;
