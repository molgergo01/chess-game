import { DEFAULT_ELO } from '../config/constants';
import db from '../config/db';
import { User } from '../models/user';

export async function createUserIfNotExists(user: User) {
    const sql =
        'INSERT INTO chess_game.users VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING';
    try {
        await db.none(sql, [user.id, user.name, user.email, DEFAULT_ELO]);
        console.log(
            'Successfully created user in DB:',
            user,
            'with Elo:',
            DEFAULT_ELO
        );
    } catch (e) {
        console.log('Failed to make call to DB.', e);
        throw new Error('Failed to make call to DB.');
    }
}
