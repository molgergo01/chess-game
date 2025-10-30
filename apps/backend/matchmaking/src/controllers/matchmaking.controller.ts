import { NextFunction, Response } from 'express';
import { inject, injectable } from 'inversify';
import MatchmakingService from '../services/matchmaking.service';
import {
    CreatePrivateQueueResponse,
    GetQueueStatusResponse,
    JoinPrivateQueueParams,
    LeavePrivateQueueParams
} from '../models/matchmaking';
import MatchmakingScheduler from '../scheduler/matchmaking.scheduler';
import { AuthenticatedRequest } from 'chess-game-backend-common/types/authenticated.request';

@injectable()
class MatchmakingController {
    constructor(
        @inject(MatchmakingService)
        public readonly matchmakingService: MatchmakingService,
        @inject(MatchmakingScheduler)
        public readonly matchmakingScheduler: MatchmakingScheduler
    ) {}

    async joinQueue(req: AuthenticatedRequest<unknown, unknown, unknown>, res: Response, next: NextFunction) {
        try {
            await this.matchmakingService.joinQueue(req.user.id, req.user.elo);
            this.matchmakingScheduler.start();
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }

    async createPrivateQueue(req: AuthenticatedRequest<unknown, unknown, unknown>, res: Response, next: NextFunction) {
        try {
            const queueId = await this.matchmakingService.createPrivateQueue(req.user.id, req.user.elo);
            const response: CreatePrivateQueueResponse = {
                queueId: queueId
            };
            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    async joinPrivateQueue(
        req: AuthenticatedRequest<JoinPrivateQueueParams, unknown, unknown>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await this.matchmakingService.joinPrivateQueue(req.user.id, req.user.elo, req.params.queueId);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }

    async leaveQueue(req: AuthenticatedRequest<unknown, unknown, unknown>, res: Response, next: NextFunction) {
        try {
            await this.matchmakingService.leaveQueue(req.user.id, null);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }

    async leavePrivateQueue(
        req: AuthenticatedRequest<LeavePrivateQueueParams, unknown, unknown>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await this.matchmakingService.leaveQueue(req.user.id, req.params.queueId);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }

    async getQueueStatus(req: AuthenticatedRequest<unknown, unknown, unknown>, res: Response, next: NextFunction) {
        try {
            const status = await this.matchmakingService.getQueueStatus(req.user.id);
            const response: GetQueueStatusResponse = {
                isQueued: status.isQueued,
                queueId: status.queueId,
                hasActiveGame: status.hasActiveGame
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }
}

export default MatchmakingController;
