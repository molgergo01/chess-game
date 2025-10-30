import MatchmakingController from '../../src/controllers/matchmaking.controller';
import MatchmakingService from '../../src/services/matchmaking.service';
import MatchmakingScheduler from '../../src/scheduler/matchmaking.scheduler';
import { NextFunction, Response } from 'express';
import { JoinPrivateQueueParams, LeavePrivateQueueParams } from '../../src/models/matchmaking';
import { AuthenticatedRequest } from 'chess-game-backend-common/types/authenticated.request';

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
            user: {
                id: '1234',
                name: 'Test User',
                email: 'test@example.com',
                elo: 1200,
                avatarUrl: 'avatar.jpg'
            }
        } as Partial<AuthenticatedRequest>;

        it('should join queue and start scheduler, returning status 200', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.joinQueue.mockResolvedValue();

            await matchmakingController.joinQueue(req as AuthenticatedRequest, res as Response, next);

            expect(mockMatchmakingService.joinQueue).toHaveBeenCalledWith('1234', 1200);
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

            await matchmakingController.joinQueue(req as AuthenticatedRequest, res as Response, next);

            expect(mockMatchmakingService.joinQueue).toHaveBeenCalledWith('1234', 1200);
            expect(next).toHaveBeenCalledWith(expectedError);
            expect(mockMatchmakingScheduler.start).not.toHaveBeenCalled();
        });
    });

    describe('Leave Queue', () => {
        const req = {
            user: {
                id: '1234',
                name: 'Test User',
                email: 'test@example.com',
                elo: 1200,
                avatarUrl: 'avatar.jpg'
            }
        } as Partial<AuthenticatedRequest>;

        it('should leave queue and return status 200', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.leaveQueue.mockResolvedValue();

            await matchmakingController.leaveQueue(req as AuthenticatedRequest, res as Response, next);

            expect(mockMatchmakingService.leaveQueue).toHaveBeenCalledWith('1234', null);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();
        });

        it('should call next function with error when error is thrown', async () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockMatchmakingService.leaveQueue.mockImplementation(() => {
                throw expectedError;
            });

            await matchmakingController.leaveQueue(req as AuthenticatedRequest, res as Response, next);

            expect(mockMatchmakingService.leaveQueue).toHaveBeenCalledWith('1234', null);
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });

    describe('Get Queue Status', () => {
        const userId = '1234';
        const req = {
            user: {
                id: userId,
                name: 'Test User',
                email: 'test@example.com',
                elo: 1200,
                avatarUrl: 'avatar.jpg'
            }
        } as Partial<AuthenticatedRequest>;

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

            await matchmakingController.getQueueStatus(req as AuthenticatedRequest, res as Response, next);

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

            await matchmakingController.getQueueStatus(req as AuthenticatedRequest, res as Response, next);

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

            await matchmakingController.getQueueStatus(req as AuthenticatedRequest, res as Response, next);

            expect(mockMatchmakingService.getQueueStatus).toHaveBeenCalledWith(userId);
            expect(next).toHaveBeenCalledWith(expectedError);
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

            await matchmakingController.getQueueStatus(req as AuthenticatedRequest, res as Response, next);

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
            user: {
                id: '1234',
                name: 'Test User',
                email: 'test@example.com',
                elo: 1200,
                avatarUrl: 'avatar.jpg'
            }
        } as Partial<AuthenticatedRequest>;

        it('should create private queue and return status 201 with queueId', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const queueId = 'test-queue-id';
            mockMatchmakingService.createPrivateQueue.mockResolvedValue(queueId);

            await matchmakingController.createPrivateQueue(req as AuthenticatedRequest, res as Response, next);

            expect(mockMatchmakingService.createPrivateQueue).toHaveBeenCalledWith('1234', 1200);
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

            await matchmakingController.createPrivateQueue(req as AuthenticatedRequest, res as Response, next);

            expect(mockMatchmakingService.createPrivateQueue).toHaveBeenCalledWith('1234', 1200);
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });

    describe('Join Private Queue', () => {
        const req = {
            user: {
                id: '1234',
                name: 'Test User',
                email: 'test@example.com',
                elo: 1200,
                avatarUrl: 'avatar.jpg'
            },
            params: {
                queueId: 'queue-456'
            }
        } as Partial<AuthenticatedRequest<JoinPrivateQueueParams>>;

        it('should join private queue and return status 200', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.joinPrivateQueue.mockResolvedValue();

            await matchmakingController.joinPrivateQueue(
                req as AuthenticatedRequest<JoinPrivateQueueParams>,
                res as Response,
                next
            );

            expect(mockMatchmakingService.joinPrivateQueue).toHaveBeenCalledWith('1234', 1200, 'queue-456');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();
        });

        it('should call next function with error when error is thrown', async () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockMatchmakingService.joinPrivateQueue.mockImplementation(() => {
                throw expectedError;
            });

            await matchmakingController.joinPrivateQueue(
                req as AuthenticatedRequest<JoinPrivateQueueParams>,
                res as Response,
                next
            );

            expect(mockMatchmakingService.joinPrivateQueue).toHaveBeenCalledWith('1234', 1200, 'queue-456');
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });

    describe('Leave Private Queue', () => {
        const req = {
            user: {
                id: '1234',
                name: 'Test User',
                email: 'test@example.com',
                elo: 1200,
                avatarUrl: 'avatar.jpg'
            },
            params: {
                queueId: 'queue-789'
            }
        } as Partial<AuthenticatedRequest<LeavePrivateQueueParams>>;

        it('should leave private queue and return status 200', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn().mockReturnThis()
            } as Partial<Response>;

            mockMatchmakingService.leaveQueue.mockResolvedValue();

            await matchmakingController.leavePrivateQueue(
                req as AuthenticatedRequest<LeavePrivateQueueParams>,
                res as Response,
                next
            );

            expect(mockMatchmakingService.leaveQueue).toHaveBeenCalledWith('1234', 'queue-789');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();
        });

        it('should call next function with error when error is thrown', async () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockMatchmakingService.leaveQueue.mockImplementation(() => {
                throw expectedError;
            });

            await matchmakingController.leavePrivateQueue(
                req as AuthenticatedRequest<LeavePrivateQueueParams>,
                res as Response,
                next
            );

            expect(mockMatchmakingService.leaveQueue).toHaveBeenCalledWith('1234', 'queue-789');
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
