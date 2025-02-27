import { createUserIfNotExists } from '../../src/repositories/user.repository';
import db from '../../src/config/db';
import { User } from '../../src/models/user';
import { DEFAULT_ELO } from '../../src/config/constants';

jest.mock('../../src/config/db', () => ({
    none: jest.fn()
}));

describe('createUserIfNotExists', () => {
    test('should make call to DB with the correct SQL query and parameters', async () => {
        const user = new User('1', 'name', 'email@email.com');
        const expectedSql =
            'INSERT INTO chess_game.users VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING';
        const expectedParams = [user.id, user.name, user.email, DEFAULT_ELO];

        await createUserIfNotExists(user);

        expect(db.none).toHaveBeenCalledWith(expectedSql, expectedParams);
    });
    test('should return error if DB call fails', async () => {
        (db.none as jest.Mock).mockRejectedValueOnce(
            new Error('Failed to make call to DB.')
        );

        await expect(
            createUserIfNotExists(null as unknown as User)
        ).rejects.toThrow('Failed to make call to DB.');
    });
});
