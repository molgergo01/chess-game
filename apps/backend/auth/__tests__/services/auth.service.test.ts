import AuthService from '../../src/services/auth.service';
import UserRepository from '../../src/repositories/user.repository';
import jwt, { JwtPayload } from 'jsonwebtoken';
import FailedLoginError from '../../src/errors/failed.login.error';
import UnauthorizedError from 'chess-game-backend-common/errors/unauthorized.error';

jest.mock('jsonwebtoken');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

jest.mock('../../src/repositories/user.repository');

describe('Auth Service', () => {
    let mockUserRepository: jest.Mocked<UserRepository>;
    let authService: AuthService;

    beforeEach(() => {
        mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
        mockUserRepository.upsertUser = jest.fn();
        mockUserRepository.getUserById = jest.fn();

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
            avatarUrl: 'avatar_url.com',
            elo: 1200
        };
        it('should persist user and return token with correct JWT structure', async () => {
            const token = 'mocked-jwt-token';
            mockedJwt.sign.mockReturnValue(token as never);

            const result = await authService.login(user);

            expect(mockUserRepository.upsertUser).toHaveBeenCalledWith({
                id: user.id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl
            });

            expect(mockedJwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    sub: user.id,
                    iat: expect.any(Number),
                    exp: expect.any(Number)
                }),
                expect.any(String)
            );

            const callArgs = mockedJwt.sign.mock.calls[0][0] as JwtPayload;
            expect(callArgs.exp! - callArgs.iat!).toBe(7 * 24 * 60 * 60);

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

    describe('Get User from Token', () => {
        const validToken = 'valid.jwt.token';
        const userId = 'user-123';
        const mockUser = {
            id: userId,
            name: 'Test User',
            email: 'test@example.com',
            avatarUrl: 'https://example.com/avatar.jpg',
            elo: 1500
        };

        it('should return user when valid token provided', async () => {
            const mockPayload: JwtPayload = {
                sub: userId,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
            };

            mockedJwt.verify.mockReturnValue(mockPayload as never);
            mockUserRepository.getUserById.mockResolvedValue(mockUser);

            const result = await authService.getUserFromToken(validToken);

            expect(mockedJwt.verify).toHaveBeenCalledWith(validToken, expect.any(String));
            expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedError when token is undefined', async () => {
            await expect(authService.getUserFromToken(undefined)).rejects.toThrow(
                new UnauthorizedError('Token not found')
            );
        });

        it('should throw UnauthorizedError when token verification fails', async () => {
            mockedJwt.verify.mockImplementation(() => {
                throw new Error('jwt malformed');
            });

            await expect(authService.getUserFromToken(validToken)).rejects.toThrow(
                new UnauthorizedError('Invalid Token')
            );
        });

        it('should throw UnauthorizedError when token is expired', async () => {
            mockedJwt.verify.mockImplementation(() => {
                throw new Error('jwt expired');
            });

            await expect(authService.getUserFromToken(validToken)).rejects.toThrow(
                new UnauthorizedError('Invalid Token')
            );
        });

        it('should throw UnauthorizedError when decoded payload is a string', async () => {
            mockedJwt.verify.mockReturnValue('string-payload' as never);

            await expect(authService.getUserFromToken(validToken)).rejects.toThrow(
                new UnauthorizedError('Invalid Token')
            );
        });

        it('should throw UnauthorizedError when sub claim is missing', async () => {
            const mockPayload: JwtPayload = {
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
            };

            mockedJwt.verify.mockReturnValue(mockPayload as never);

            await expect(authService.getUserFromToken(validToken)).rejects.toThrow(
                new UnauthorizedError('Invalid Token')
            );
        });

        it('should throw UnauthorizedError when user not found in database', async () => {
            const mockPayload: JwtPayload = {
                sub: userId,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
            };

            mockedJwt.verify.mockReturnValue(mockPayload as never);
            mockUserRepository.getUserById.mockResolvedValue(null);

            await expect(authService.getUserFromToken(validToken)).rejects.toThrow(
                new UnauthorizedError('Invalid User in Token')
            );
        });
    });
});
