import { DEFAULT_ELO } from 'chess-game-backend-common/config/constants';
import { injectable } from 'inversify';
import db from 'chess-game-backend-common/config/db';
import { User } from '../models/user';

@injectable()
class UserRepository {
    async createUserIfNotExists(user: User) {
        const sql =
            'INSERT INTO chess_game.users VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING';
        await db.none(sql, [user.id, user.name, user.email, DEFAULT_ELO]);
        console.log(
            'Successfully created user in DB:',
            user,
            'with Elo:',
            DEFAULT_ELO
        );
    }
}

export default UserRepository;
