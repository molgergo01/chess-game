import { DEFAULT_ELO } from '../config/constants';
import db from '../config/db';
import { User } from '../models/user';

export async function createUserIfNotExists(user: User) {
    const sql =
        'INSERT INTO chess_game.users VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING';
    db.none(sql, [user.id, user.name, user.email, DEFAULT_ELO]);
}
