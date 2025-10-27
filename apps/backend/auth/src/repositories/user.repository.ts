import { DEFAULT_ELO } from 'chess-game-backend-common/config/constants';
import { injectable } from 'inversify';
import db from 'chess-game-backend-common/config/db';
import { User } from '../models/user';

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
}

export default UserRepository;
