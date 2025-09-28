import MatchmakingController from '../../src/controllers/matchmaking.controller';
import MatchmakingService from '../../src/services/matchmaking.service';
import MatchmakingScheduler from '../../src/scheduler/matchmaking.scheduler';
import { NextFunction, Request, Response } from 'express';
import {
    IsInQueueParams,
    LeaveQueueParams
} from '../../src/models/matchmaking';

jest.mock('../../src/services/matchmaking.service');
jest.mock('../../src/scheduler/matchmaking.scheduler');
jest.mock('../../src/config/container');

describe('Matchmaking Controller', () => {
    let mockMatchmakingService: jest.Mocked<MatchmakingService>;
    let mockMatchmakingScheduler: jest.Mocked<MatchmakingScheduler>;
    let matchmakingController: MatchmakingController;

    beforeEach(() => {
        mockMatchmakingService = new MatchmakingService(
            null as never,
            null as never,
            null as never,
            null as never
        ) as jest.Mocked<MatchmakingService>;
        mockMatchmakingService.joinQueue = jest.fn();
        mockMatchmakingService.leaveQueue = jest.fn();
        mockMatchmakingService.checkInQueue = jest.fn();

        mockMatchmakingScheduler = new MatchmakingScheduler(
            null as never
        ) as jest.Mocked<MatchmakingScheduler>;
        mockMatchmakingScheduler.start = jest.fn();

        matchmakingController = new MatchmakingController(
            mockMatchmakingService,
            mockMatchmakingScheduler
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    const next: NextFunction = jest.fn();

    describe('Join Queue', () => {
        const req = {
            body: {
                userId: '1234'
            }
        } as Partial<Request>;

        it('should join queue and start scheduler, returning status 200', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.joinQueue.mockResolvedValue();

            await matchmakingController.joinQueue(
                req as Request,
                res as Response,
                next
            );

            expect(mockMatchmakingService.joinQueue).toHaveBeenCalledWith(
                req.body.userId
            );
            expect(mockMatchmakingScheduler.start).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();
        });

        it('should call next function with error when error is thrown', async () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockMatchmakingService.joinQueue.mockImplementation(() => {
                throw expectedError;
            });

            await matchmakingController.joinQueue(
                req as Request,
                res as Response,
                next
            );

            expect(mockMatchmakingService.joinQueue).toHaveBeenCalledWith(
                req.body.userId
            );
            expect(next).toHaveBeenCalledWith(expectedError);
            expect(mockMatchmakingScheduler.start).not.toHaveBeenCalled();
        });
    });

    describe('Leave Queue', () => {
        const req = {
            params: { userId: '1234' }
        } as Partial<Request> as Request<LeaveQueueParams>;

        it('should leave queue and return status 200', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.leaveQueue.mockResolvedValue();

            await matchmakingController.leaveQueue(req, res as Response, next);

            expect(mockMatchmakingService.leaveQueue).toHaveBeenCalledWith(
                req.params.userId
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();
        });

        it('should call next function with error when error is thrown', async () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockMatchmakingService.leaveQueue.mockImplementation(() => {
                throw expectedError;
            });

            await matchmakingController.leaveQueue(
                req as Request<LeaveQueueParams>,
                res as Response,
                next
            );

            expect(mockMatchmakingService.leaveQueue).toHaveBeenCalledWith(
                req.params.userId
            );
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });

    describe('Get Is In Queue', () => {
        const req = {
            params: {
                userId: '1234'
            }
        } as Partial<Request> as Request<IsInQueueParams>;

        it('should check if user is in queue and return status 200', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.checkInQueue.mockResolvedValue();

            await matchmakingController.getIsInQueue(
                req,
                res as Response,
                next
            );

            expect(mockMatchmakingService.checkInQueue).toHaveBeenCalledWith(
                req.params.userId
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: `User with id ${req.params.userId} is queued`
            });
        });

        it('should call next function with error when error is thrown', async () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockMatchmakingService.checkInQueue.mockImplementation(() => {
                throw expectedError;
            });

            await matchmakingController.getIsInQueue(
                req,
                res as Response,
                next
            );

            expect(mockMatchmakingService.checkInQueue).toHaveBeenCalledWith(
                req.params.userId
            );
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
