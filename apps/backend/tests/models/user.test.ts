import { User } from '../../src/models/user';

describe('User constructor', () => {
    test('should return user with correct values', () => {
        const expectedId = 1;
        const expectedName = 'name';
        const expectedEmail = 'email@email.com';

        const user = new User(expectedId, expectedName, expectedEmail);

        expect(user.id).toBe(expectedId);
        expect(user.name).toBe(expectedName);
        expect(user.email).toBe(expectedEmail);
    });
});
