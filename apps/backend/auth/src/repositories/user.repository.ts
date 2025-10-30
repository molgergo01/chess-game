import { DEFAULT_ELO } from 'chess-game-backend-common/config/constants';
import { injectable } from 'inversify';
import db from 'chess-game-backend-common/config/db';
import { AuthUser, User } from '../models/user';
import { UserEntity } from '../models/entities';

@injectable()
class UserRepository {
    async upsertUser(user: User) {
        const sql = `INSERT INTO chess_game.users VALUES ($1, $2, $3, $4, $5) 
                        ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        email = EXCLUDED.email,
                        avatar_url = EXCLUDED.avatar_url`;
        await db.none(sql, [user.id, user.name, user.email, DEFAULT_ELO, user.avatarUrl]);
    }

    async getUserById(id: string): Promise<AuthUser | null> {
        const sql = `
            SELECT *
            FROM chess_game.users
            WHERE id = $1;
        `;

        const result: Array<UserEntity> = await db.query(sql, [id]);

        if (result.length === 0) {
            return null;
        }

        const row = result[0];

        return {
            id: row.id,
            name: row.name,
            email: row.email,
            elo: row.elo,
            avatarUrl: row.avatar_url
        };
    }
}

export default UserRepository;
