import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import MatchmakingService from '../services/matchmaking.service';
import {
    IsInQueueParams,
    JoinQueueRequest,
    LeaveQueueParams
} from '../models/matchmaking';
import MatchmakingScheduler from '../scheduler/matchmaking.scheduler';

@injectable()
class MatchmakingController {
    constructor(
        @inject(MatchmakingService)
        public readonly matchmakingService: MatchmakingService,
        @inject(MatchmakingScheduler)
        public readonly matchmakingScheduler: MatchmakingScheduler
    ) {}

    async joinQueue(
        req: Request<unknown, unknown, JoinQueueRequest>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await this.matchmakingService.joinQueue(req.body.userId);
            this.matchmakingScheduler.start();
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }

    async leaveQueue(
        req: Request<LeaveQueueParams, unknown, unknown>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await this.matchmakingService.leaveQueue(req.params.userId);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }

    async getIsInQueue(
        req: Request<IsInQueueParams, unknown, unknown>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await this.matchmakingService.checkInQueue(req.params.userId);
            res.status(200).json({
                message: `User with id ${req.params.userId} is queued`
            });
        } catch (error) {
            next(error);
        }
    }
}

export default MatchmakingController;
