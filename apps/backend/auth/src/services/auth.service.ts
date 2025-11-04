import { inject, injectable } from 'inversify';
import jwt, { JwtPayload } from 'jsonwebtoken';
import UserRepository from '../repositories/user.repository';
import { AuthUser, User } from '../models/user';
import env from 'chess-game-backend-common/config/env';
import FailedLoginError from '../errors/failed.login.error';
import UnauthorizedError from 'chess-game-backend-common/errors/unauthorized.error';
import { Transactional } from 'chess-game-backend-common/transaction/transactional.decorator';

@injectable()
class AuthService {
    constructor(
        @inject(UserRepository)
        private readonly userRepository: UserRepository
    ) {}

    @Transactional()
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

        const now = Math.floor(Date.now() / 1000);
        const payload: JwtPayload = {
            sub: user.id,
            iat: now,
            exp: now + 7 * 24 * 60 * 60 // 7d
        };

        return jwt.sign(payload, env.JWT_SECRET!);
    }

    @Transactional({ readOnly: true })
    async getUserFromToken(token: string | undefined): Promise<AuthUser> {
        if (!token) {
            throw new UnauthorizedError('Token not found');
        }

        let decoded: unknown;
        try {
            decoded = jwt.verify(token, env.JWT_SECRET!);
        } catch (error) {
            console.warn(error);
            throw new UnauthorizedError('Invalid Token');
        }
        if (typeof decoded === 'string') {
            throw new UnauthorizedError('Invalid Token');
        }

        const payload = decoded as JwtPayload;

        if (!payload.sub) {
            throw new UnauthorizedError('Invalid Token');
        }

        const user = await this.userRepository.getUserById(payload.sub);

        if (!user) {
            throw new UnauthorizedError('Invalid User in Token');
        }

        return user;
    }
}

export default AuthService;
