import UsersRepository from '../repositories/users.repository';
import { inject, injectable } from 'inversify';
import { UserResult } from '../models/user';

@injectable()
class UserService {
    constructor(
        @inject(UsersRepository)
        private readonly usersRepository: UsersRepository
    ) {}

    async getUsers(limit: number | null, offset: number | null): Promise<UserResult> {
        const users = await this.usersRepository.findAll(limit, offset);
        const totalUsersCount = await this.usersRepository.countAll();

        return {
            users: users,
            totalCount: totalUsersCount
        };
    }
}

export default UserService;
