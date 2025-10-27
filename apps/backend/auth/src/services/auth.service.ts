import { inject, injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import UserRepository from '../repositories/user.repository';
import { User } from '../models/user';
import env from 'chess-game-backend-common/config/env';
import FailedLoginError from '../errors/failed.login.error';
import UnauthorizedError from 'chess-game-backend-common/errors/unauthorized.error';

@injectable()
class AuthService {
    constructor(
        @inject(UserRepository)
        private readonly userRepository: UserRepository
    ) {}

    async login(reqUser: Express.User | undefined): Promise<string> {
        if (!reqUser) {
            throw new FailedLoginError('User is missing from auth request');
        }
        const user = new User(reqUser.id, reqUser.name, reqUser.email, reqUser.avatarUrl);
        try {
            await this.userRepository.upsertUser(user);
        } catch (error) {
            console.error(error);
            throw new FailedLoginError();
        }

        return jwt.sign(
            { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
            env.JWT_SECRET!,
            {
                expiresIn: '7d'
            }
        );
    }

    getUserFromToken(token: string | undefined) {
        if (!token) {
            throw new UnauthorizedError('Token not found');
        }

        try {
            return jwt.verify(token, env.JWT_SECRET!);
        } catch (error) {
            console.warn(error);
            throw new UnauthorizedError('Invalid Token');
        }
    }
}

export default AuthService;
