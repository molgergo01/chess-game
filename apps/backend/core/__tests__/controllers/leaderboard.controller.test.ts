import LeaderboardController from '../../src/controllers/leaderboard.controller';
import UserService from '../../src/services/user.service';
import { NextFunction, Request, Response } from 'express';
import { UserResult } from '../../src/models/user';
import { GetLeaderboardResponse } from '../../src/models/responses';

jest.mock('../../src/services/user.service');

describe('Leaderboard Controller', () => {
    let mockUserService: jest.Mocked<UserService>;
    let leaderboardController: LeaderboardController;

    beforeEach(() => {
        mockUserService = new UserService(null as never) as jest.Mocked<UserService>;
        mockUserService.getUsers = jest.fn();

        leaderboardController = new LeaderboardController(mockUserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    const next: NextFunction = jest.fn();

    describe('Get Leaderboard', () => {
        it('should get leaderboard with limit and offset query parameters and return status 200', async () => {
            const req = {
                query: {
                    limit: '10',
                    offset: '5'
                }
            } as Partial<Request>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const userResult: UserResult = {
                users: [
                    {
                        id: 'user1',
                        rank: 1,
                        name: 'Player One',
                        elo: 1600,
                        avatarUrl: 'avatar1.com'
                    },
                    {
                        id: 'user2',
                        rank: 2,
                        name: 'Player Two',
                        elo: 1500,
                        avatarUrl: 'avatar2.com'
                    }
                ],
                totalCount: 20
            };

            const expectedResponse: GetLeaderboardResponse = {
                users: [
                    {
                        userId: 'user1',
                        rank: 1,
                        name: 'Player One',
                        elo: 1600,
                        avatarUrl: 'avatar1.com'
                    },
                    {
                        userId: 'user2',
                        rank: 2,
                        name: 'Player Two',
                        elo: 1500,
                        avatarUrl: 'avatar2.com'
                    }
                ],
                totalCount: 20
            };

            mockUserService.getUsers.mockResolvedValue(userResult);

            await leaderboardController.getLeaderboard(req as Request, res as Response, next);

            expect(mockUserService.getUsers).toHaveBeenCalledWith(10, 5);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should get leaderboard with only limit and return status 200', async () => {
            const req = {
                query: {
                    limit: '10'
                }
            } as Partial<Request>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const userResult: UserResult = {
                users: [
                    {
                        id: 'user1',
                        rank: 1,
                        name: 'Player One',
                        elo: 1600,
                        avatarUrl: 'avatar1.com'
                    }
                ],
                totalCount: 10
            };

            mockUserService.getUsers.mockResolvedValue(userResult);

            await leaderboardController.getLeaderboard(req as Request, res as Response, next);

            expect(mockUserService.getUsers).toHaveBeenCalledWith(10, null);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should get leaderboard with only offset and return status 200', async () => {
            const req = {
                query: {
                    offset: '5'
                }
            } as Partial<Request>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const userResult: UserResult = {
                users: [
                    {
                        id: 'user1',
                        rank: 1,
                        name: 'Player One',
                        elo: 1600,
                        avatarUrl: 'avatar1.com'
                    }
                ],
                totalCount: 10
            };

            mockUserService.getUsers.mockResolvedValue(userResult);

            await leaderboardController.getLeaderboard(req as Request, res as Response, next);

            expect(mockUserService.getUsers).toHaveBeenCalledWith(null, 5);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should get leaderboard with no query parameters and return status 200', async () => {
            const req = {
                query: {}
            } as Partial<Request>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const userResult: UserResult = {
                users: [
                    {
                        id: 'user1',
                        rank: 1,
                        name: 'Player One',
                        elo: 1600,
                        avatarUrl: null
                    },
                    {
                        id: 'user2',
                        rank: 2,
                        name: 'Player Two',
                        elo: 1500,
                        avatarUrl: null
                    }
                ],
                totalCount: 2
            };

            const expectedResponse: GetLeaderboardResponse = {
                users: [
                    {
                        userId: 'user1',
                        rank: 1,
                        name: 'Player One',
                        elo: 1600,
                        avatarUrl: null
                    },
                    {
                        userId: 'user2',
                        rank: 2,
                        name: 'Player Two',
                        elo: 1500,
                        avatarUrl: null
                    }
                ],
                totalCount: 2
            };

            mockUserService.getUsers.mockResolvedValue(userResult);

            await leaderboardController.getLeaderboard(req as Request, res as Response, next);

            expect(mockUserService.getUsers).toHaveBeenCalledWith(null, null);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should call next function with error when error is thrown', async () => {
            const req = {
                query: {
                    limit: '10',
                    offset: '5'
                }
            } as Partial<Request>;
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');

            mockUserService.getUsers.mockRejectedValue(expectedError);

            await leaderboardController.getLeaderboard(req as Request, res as Response, next);

            expect(mockUserService.getUsers).toHaveBeenCalledWith(10, 5);
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
