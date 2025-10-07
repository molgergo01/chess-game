import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import MatchmakingService from '../services/matchmaking.service';
import {
    CreatePrivateQueueRequest,
    CreatePrivateQueueResponse,
    JoinPrivateQueueParams,
    JoinPrivateQueueRequest,
    JoinQueueRequest,
    LeavePrivateQueueParams,
    LeavePrivateQueueRequest,
    LeaveQueueRequest
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

    async joinQueue(req: Request<unknown, unknown, JoinQueueRequest>, res: Response, next: NextFunction) {
        try {
            await this.matchmakingService.joinQueue(req.body.userId);
            this.matchmakingScheduler.start();
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }

    async createPrivateQueue(
        req: Request<unknown, unknown, CreatePrivateQueueRequest>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const queueId = await this.matchmakingService.createPrivateQueue(req.body.userId);
            const response: CreatePrivateQueueResponse = {
                queueId: queueId
            };
            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    async joinPrivateQueue(
        req: Request<JoinPrivateQueueParams, unknown, JoinPrivateQueueRequest>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await this.matchmakingService.joinPrivateQueue(req.body.userId, req.params.queueId);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }

    async leaveQueue(req: Request<unknown, unknown, LeaveQueueRequest>, res: Response, next: NextFunction) {
        try {
            await this.matchmakingService.leaveQueue(req.body.userId, null);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }

    async leavePrivateQueue(
        req: Request<LeavePrivateQueueParams, unknown, LeavePrivateQueueRequest>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await this.matchmakingService.leaveQueue(req.body.userId, req.params.queueId);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }

    async getQueueStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.query.userId;

            if (!userId || typeof userId !== 'string') {
                res.status(400).json({ message: 'userId query parameter is required' });
                return;
            }

            const queueId = await this.matchmakingService.getQueue(userId);
            res.status(200).json({
                message: `User with id ${userId} is queued`,
                queueId: queueId === '' ? null : queueId
            });
        } catch (error) {
            next(error);
        }
    }
}

export default MatchmakingController;
