import UserService from '../../src/services/user.service';
import UsersRepository from '../../src/repositories/users.repository';
import { LeaderboardUser, UserResult } from '../../src/models/user';
import BadRequestError from 'chess-game-backend-common/errors/bad.request.error';

jest.mock('../../src/repositories/users.repository');

describe('User Service', () => {
    let mockUsersRepository: jest.Mocked<UsersRepository>;
    let userService: UserService;

    beforeEach(() => {
        mockUsersRepository = new UsersRepository() as jest.Mocked<UsersRepository>;
        mockUsersRepository.findAll = jest.fn();
        mockUsersRepository.countAll = jest.fn();

        userService = new UserService(mockUsersRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Get Users', () => {
        it('should return correct users and total users count', async () => {
            const mockUsers: Array<LeaderboardUser> = [
                {
                    id: '1234',
                    rank: 1,
                    name: 'User 1',
                    elo: 1600,
                    avatarUrl: 'avatar1.com'
                },
                {
                    id: '5678',
                    rank: 2,
                    name: 'User 2',
                    elo: 1500,
                    avatarUrl: 'avatar2.com'
                }
            ];
            const totalCount = 10;

            mockUsersRepository.findAll.mockResolvedValue(mockUsers);
            mockUsersRepository.countAll.mockResolvedValue(totalCount);

            const expectedResult: UserResult = {
                users: mockUsers,
                totalCount: totalCount
            };

            const result = await userService.getUsers(5, 0);

            expect(result).toEqual(expectedResult);
            expect(mockUsersRepository.findAll).toHaveBeenCalledWith(5, 0);
            expect(mockUsersRepository.countAll).toHaveBeenCalled();
        });

        it('should apply limit parameter correctly', async () => {
            const limit = 5;
            mockUsersRepository.findAll.mockResolvedValue([]);
            mockUsersRepository.countAll.mockResolvedValue(0);

            await userService.getUsers(limit, undefined);

            expect(mockUsersRepository.findAll).toHaveBeenCalledWith(limit, undefined);
        });

        it('should apply offset parameter correctly', async () => {
            const offset = 10;
            mockUsersRepository.findAll.mockResolvedValue([]);
            mockUsersRepository.countAll.mockResolvedValue(0);

            await userService.getUsers(undefined, offset);

            expect(mockUsersRepository.findAll).toHaveBeenCalledWith(undefined, offset);
        });

        it('should apply both limit and offset together', async () => {
            const limit = 5;
            const offset = 10;
            mockUsersRepository.findAll.mockResolvedValue([]);
            mockUsersRepository.countAll.mockResolvedValue(0);

            await userService.getUsers(limit, offset);

            expect(mockUsersRepository.findAll).toHaveBeenCalledWith(limit, offset);
        });

        it('should handle undefined limit and offset', async () => {
            mockUsersRepository.findAll.mockResolvedValue([]);
            mockUsersRepository.countAll.mockResolvedValue(0);

            await userService.getUsers(undefined, undefined);

            expect(mockUsersRepository.findAll).toHaveBeenCalledWith(undefined, undefined);
        });

        it('should throw BadRequestError when limit is negative', async () => {
            const limit = -5;

            await expect(userService.getUsers(limit, undefined)).rejects.toThrow(BadRequestError);
            await expect(userService.getUsers(limit, undefined)).rejects.toThrow('Limit must be a non-negative number');
        });

        it('should throw BadRequestError when offset is negative', async () => {
            const offset = -10;

            await expect(userService.getUsers(undefined, offset)).rejects.toThrow(BadRequestError);
            await expect(userService.getUsers(undefined, offset)).rejects.toThrow(
                'Offset must be a non-negative number'
            );
        });
    });
});
