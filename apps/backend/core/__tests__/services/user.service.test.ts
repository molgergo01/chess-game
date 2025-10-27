import UserService from '../../src/services/user.service';
import UsersRepository from '../../src/repositories/users.repository';
import { LeaderboardUser, UserResult } from '../../src/models/user';

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
    });
});
