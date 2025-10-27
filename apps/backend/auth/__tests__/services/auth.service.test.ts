import AuthService from '../../src/services/auth.service';
import UserRepository from '../../src/repositories/user.repository';
import jwt from 'jsonwebtoken';
import FailedLoginError from '../../src/errors/failed.login.error';

jest.mock('jsonwebtoken');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

jest.mock('../../src/repositories/user.repository');

describe('Auth Service', () => {
    let mockUserRepository: jest.Mocked<UserRepository>;
    let authService: AuthService;

    beforeEach(() => {
        mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
        mockUserRepository.upsertUser = jest.fn();

        authService = new AuthService(mockUserRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('Login', () => {
        const user: Express.User = {
            id: 'id',
            name: 'name',
            email: 'email@email.com',
            avatarUrl: 'avatar_url.com'
        };
        it('should persist user and return token', async () => {
            const token = 'token';
            const tokenPromise = Promise.resolve(token);
            mockedJwt.sign.mockImplementation(() => {
                return tokenPromise;
            });

            const result = await authService.login(user);

            expect(mockUserRepository.upsertUser).toHaveBeenCalledWith({
                id: user.id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl
            });
            expect(result).toEqual(token);
        });

        describe('should throw failed login error', () => {
            it('when user is undefined', async () => {
                await expect(authService.login(undefined)).rejects.toThrow(
                    new FailedLoginError('User is missing from auth request')
                );
            });
            it('when db call fails', async () => {
                mockUserRepository.upsertUser.mockRejectedValue(new Error());

                await expect(authService.login(user)).rejects.toThrow(FailedLoginError);
            });
        });
    });

    describe('Get User from Token', () => {});
});
