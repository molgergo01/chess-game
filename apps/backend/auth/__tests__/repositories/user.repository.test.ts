import db from 'chess-game-backend-common/config/db';
import { User } from '../../src/models/user';
import { DEFAULT_ELO } from 'chess-game-backend-common/config/constants';
import UserRepository from '../../src/repositories/user.repository';

jest.mock('chess-game-backend-common/config/db', () => ({
    none: jest.fn()
}));

describe('User Repository', () => {
    let userRepository: UserRepository;

    beforeEach(() => {
        userRepository = new UserRepository();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('Create User If Not Exists', () => {
        it('should make call to DB with the correct SQL query and parameters', async () => {
            const user = new User('1', 'name', 'email@email.com');
            const expectedSql = 'INSERT INTO chess_game.users VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING';
            const expectedParams = [user.id, user.name, user.email, DEFAULT_ELO];

            await userRepository.createUserIfNotExists(user);

            expect(db.none).toHaveBeenCalledWith(expectedSql, expectedParams);
        });
        it('should return error if DB call fails', async () => {
            const user = new User('1', 'name', 'email@email.com');

            (db.none as jest.Mock).mockRejectedValue(new Error('Failed to make call to DB.'));

            await expect(userRepository.createUserIfNotExists(user)).rejects.toThrow('Failed to make call to DB.');
        });
    });
});
