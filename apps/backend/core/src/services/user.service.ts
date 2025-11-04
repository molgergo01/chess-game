import UsersRepository from '../repositories/users.repository';
import { inject, injectable } from 'inversify';
import { UserResult } from '../models/user';
import BadRequestError from 'chess-game-backend-common/errors/bad.request.error';
import { Transactional } from 'chess-game-backend-common/transaction/transactional.decorator';

@injectable()
class UserService {
    constructor(
        @inject(UsersRepository)
        private readonly usersRepository: UsersRepository
    ) {}

    @Transactional({ readOnly: true })
    async getUsers(limit: number | undefined, offset: number | undefined): Promise<UserResult> {
        if (limit && Number(limit) < 0) {
            throw new BadRequestError('Limit must be a non-negative number');
        }
        if (offset && Number(offset) < 0) {
            throw new BadRequestError('Offset must be a non-negative number');
        }

        const users = await this.usersRepository.findAll(limit, offset);
        const totalUsersCount = await this.usersRepository.countAll();

        return {
            users: users,
            totalCount: totalUsersCount
        };
    }
}

export default UserService;
