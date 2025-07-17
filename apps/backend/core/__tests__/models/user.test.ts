import { User } from '../../src/models/user';

describe('User constructor', () => {
    test('should return user with correct values', () => {
        const expectedId = '1';
        const expectedName = 'name';
        const expectedEmail = 'email@email.com';

        const user = new User(expectedId, expectedName, expectedEmail);

        expect(user.id).toBe(expectedId);
        expect(user.name).toBe(expectedName);
        expect(user.email).toBe(expectedEmail);
    });
    test('should throw error if id is missing', () => {
        const expectedId = undefined;
        const expectedName = 'name';
        const expectedEmail = 'email@email.com';

        expect(() => new User(expectedId, expectedName, expectedEmail)).toThrow(
            'User must have an id, name and email'
        );
    });
    test('should throw error if name is missing', () => {
        const expectedId = '1';
        const expectedName = 'name';
        const expectedEmail = undefined;

        expect(() => new User(expectedId, expectedName, expectedEmail)).toThrow(
            'User must have an id, name and email'
        );
    });
    test('should throw error if email is missing', () => {
        const expectedId = '1';
        const expectedName = 'name';
        const expectedEmail = undefined;

        expect(() => new User(expectedId, expectedName, expectedEmail)).toThrow(
            'User must have an id, name and email'
        );
    });
});
