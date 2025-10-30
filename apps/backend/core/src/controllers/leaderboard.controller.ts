import UserService from '../services/user.service';
import { inject, injectable } from 'inversify';
import { NextFunction, Response } from 'express';
import { GetLeaderboardResponse, LeaderboardUserDto } from '../models/responses';
import { AuthenticatedRequest } from 'chess-game-backend-common/types/authenticated.request';
import { PaginationQueryParams } from '../models/requests';

@injectable()
class LeaderboardController {
    constructor(
        @inject(UserService)
        private readonly userService: UserService
    ) {}

    async getLeaderboard(
        req: AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const result = await this.userService.getUsers(req.query.limit, req.query.offset);

            const userDtos = result.users.map(
                (user): LeaderboardUserDto => ({
                    userId: user.id,
                    rank: user.rank,
                    name: user.name,
                    elo: user.elo,
                    avatarUrl: user.avatarUrl
                })
            );

            const response: GetLeaderboardResponse = {
                users: userDtos,
                totalCount: result.totalCount
            };

            res.status(200).json(response);
        } catch (e) {
            next(e);
        }
    }
}

export default LeaderboardController;
