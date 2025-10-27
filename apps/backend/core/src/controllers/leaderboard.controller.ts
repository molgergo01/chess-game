import UserService from '../services/user.service';
import { inject, injectable } from 'inversify';
import { NextFunction, Request, Response } from 'express';
import { GetLeaderboardResponse, LeaderboardUserDto } from '../models/responses';

@injectable()
class LeaderboardController {
    constructor(
        @inject(UserService)
        private readonly userService: UserService
    ) {}

    async getLeaderboard(req: Request, res: Response, next: NextFunction) {
        try {
            let limit: number | null;
            let offset: number | null;

            const limitParam = req.query.limit;
            const offsetParam = req.query.offset;
            if (!limitParam || typeof limitParam !== 'string') {
                limit = null;
            } else {
                limit = parseInt(limitParam);
            }
            if (!offsetParam || typeof offsetParam !== 'string') {
                offset = null;
            } else {
                offset = parseInt(offsetParam);
            }

            const result = await this.userService.getUsers(limit, offset);

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
