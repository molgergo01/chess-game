import MatchmakingController from '../../src/controllers/matchmaking.controller';
import MatchmakingService from '../../src/services/matchmaking.service';
import MatchmakingScheduler from '../../src/scheduler/matchmaking.scheduler';
import { NextFunction, Request, Response } from 'express';
import {
    CreatePrivateQueueRequest,
    JoinPrivateQueueParams,
    LeavePrivateQueueParams
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
            null as never,
            null as never
        ) as jest.Mocked<MatchmakingService>;
        mockMatchmakingService.joinQueue = jest.fn();
        mockMatchmakingService.createPrivateQueue = jest.fn();
        mockMatchmakingService.joinPrivateQueue = jest.fn();
        mockMatchmakingService.leaveQueue = jest.fn();
        mockMatchmakingService.getQueueStatus = jest.fn();

        mockMatchmakingScheduler = new MatchmakingScheduler(null as never) as jest.Mocked<MatchmakingScheduler>;
        mockMatchmakingScheduler.start = jest.fn();

        matchmakingController = new MatchmakingController(mockMatchmakingService, mockMatchmakingScheduler);
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

            await matchmakingController.joinQueue(req as Request, res as Response, next);

            expect(mockMatchmakingService.joinQueue).toHaveBeenCalledWith(req.body.userId);
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

            await matchmakingController.joinQueue(req as Request, res as Response, next);

            expect(mockMatchmakingService.joinQueue).toHaveBeenCalledWith(req.body.userId);
            expect(next).toHaveBeenCalledWith(expectedError);
            expect(mockMatchmakingScheduler.start).not.toHaveBeenCalled();
        });
    });

    describe('Leave Queue', () => {
        const req = {
            body: { userId: '1234' }
        } as Partial<Request>;

        it('should leave queue and return status 200', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.leaveQueue.mockResolvedValue();

            await matchmakingController.leaveQueue(req as Request, res as Response, next);

            expect(mockMatchmakingService.leaveQueue).toHaveBeenCalledWith(req.body.userId, null);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();
        });

        it('should call next function with error when error is thrown', async () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockMatchmakingService.leaveQueue.mockImplementation(() => {
                throw expectedError;
            });

            await matchmakingController.leaveQueue(req as Request, res as Response, next);

            expect(mockMatchmakingService.leaveQueue).toHaveBeenCalledWith(req.body.userId, null);
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });

    describe('Get Queue Status', () => {
        const userId = '1234';
        const req = {
            query: {
                userId: userId
            }
        } as unknown as Request;

        it('should check if user is in default queue and return status 200 with queueId null', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.getQueueStatus.mockResolvedValue({
                isQueued: true,
                queueId: null,
                hasActiveGame: false
            });

            await matchmakingController.getQueueStatus(req, res as Response, next);

            expect(mockMatchmakingService.getQueueStatus).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                isQueued: true,
                queueId: null,
                hasActiveGame: false
            });
        });

        it('should check if user is in private queue and return status 200 with queueId', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const privateQueueId = 'private-queue-123';
            mockMatchmakingService.getQueueStatus.mockResolvedValue({
                isQueued: true,
                queueId: privateQueueId,
                hasActiveGame: false
            });

            await matchmakingController.getQueueStatus(req, res as Response, next);

            expect(mockMatchmakingService.getQueueStatus).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                isQueued: true,
                queueId: privateQueueId,
                hasActiveGame: false
            });
        });

        it('should call next function with error when error is thrown', async () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockMatchmakingService.getQueueStatus.mockImplementation(() => {
                throw expectedError;
            });

            await matchmakingController.getQueueStatus(req, res as Response, next);

            expect(mockMatchmakingService.getQueueStatus).toHaveBeenCalledWith(userId);
            expect(next).toHaveBeenCalledWith(expectedError);
        });

        it('should throw return 400 when userId is not set', async () => {
            const emptyReq = {
                query: {}
            } as Partial<Request>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            await matchmakingController.getQueueStatus(emptyReq as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalled();
        });

        it('should return status 200 with hasActiveGame true when user has active game', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.getQueueStatus.mockResolvedValue({
                isQueued: false,
                queueId: null,
                hasActiveGame: true
            });

            await matchmakingController.getQueueStatus(req, res as Response, next);

            expect(mockMatchmakingService.getQueueStatus).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                isQueued: false,
                queueId: null,
                hasActiveGame: true
            });
        });
    });

    describe('Create Private Queue', () => {
        const req = {
            body: {
                userId: '1234'
            }
        } as Partial<Request> as Request<unknown, unknown, CreatePrivateQueueRequest>;

        it('should create private queue and return status 201 with queueId', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const queueId = 'test-queue-id';
            mockMatchmakingService.createPrivateQueue.mockResolvedValue(queueId);

            await matchmakingController.createPrivateQueue(req, res as Response, next);

            expect(mockMatchmakingService.createPrivateQueue).toHaveBeenCalledWith(req.body.userId);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                queueId: queueId
            });
        });

        it('should call next function with error when error is thrown', async () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockMatchmakingService.createPrivateQueue.mockImplementation(() => {
                throw expectedError;
            });

            await matchmakingController.createPrivateQueue(req, res as Response, next);

            expect(mockMatchmakingService.createPrivateQueue).toHaveBeenCalledWith(req.body.userId);
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });

    describe('Join Private Queue', () => {
        const req = {
            body: {
                userId: '1234'
            },
            params: {
                queueId: 'queue-456'
            }
        } as Partial<Request> as Request<JoinPrivateQueueParams>;

        it('should join private queue and return status 200', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.joinPrivateQueue.mockResolvedValue();

            await matchmakingController.joinPrivateQueue(req, res as Response, next);

            expect(mockMatchmakingService.joinPrivateQueue).toHaveBeenCalledWith(req.body.userId, req.params.queueId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();
        });

        it('should call next function with error when error is thrown', async () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockMatchmakingService.joinPrivateQueue.mockImplementation(() => {
                throw expectedError;
            });

            await matchmakingController.joinPrivateQueue(req, res as Response, next);

            expect(mockMatchmakingService.joinPrivateQueue).toHaveBeenCalledWith(req.body.userId, req.params.queueId);
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });

    describe('Leave Private Queue', () => {
        const req = {
            body: {
                userId: '1234'
            },
            params: {
                queueId: 'queue-789'
            }
        } as Partial<Request> as Request<LeavePrivateQueueParams>;

        it('should leave private queue and return status 200', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.leaveQueue.mockResolvedValue();

            await matchmakingController.leavePrivateQueue(req, res as Response, next);

            expect(mockMatchmakingService.leaveQueue).toHaveBeenCalledWith(req.body.userId, req.params.queueId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();
        });

        it('should call next function with error when error is thrown', async () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockMatchmakingService.leaveQueue.mockImplementation(() => {
                throw expectedError;
            });

            await matchmakingController.leavePrivateQueue(req, res as Response, next);

            expect(mockMatchmakingService.leaveQueue).toHaveBeenCalledWith(req.body.userId, req.params.queueId);
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
