import LeaderboardController from '../../src/controllers/leaderboard.controller';
import UserService from '../../src/services/user.service';
import { NextFunction, Response } from 'express';
import { UserResult } from '../../src/models/user';
import { GetLeaderboardResponse } from '../../src/models/responses';
import { AuthenticatedRequest } from 'chess-game-backend-common/types/authenticated.request';
import { PaginationQueryParams } from '../../src/models/requests';

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
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1600,
                    avatarUrl: 'avatar1.com'
                },
                query: {
                    limit: 10,
                    offset: 5
                }
            } as Partial<AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>>;
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

            await leaderboardController.getLeaderboard(
                req as AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>,
                res as Response,
                next
            );

            expect(mockUserService.getUsers).toHaveBeenCalledWith(10, 5);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should get leaderboard with only limit and return status 200', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1600,
                    avatarUrl: 'avatar1.com'
                },
                query: {
                    limit: 10
                }
            } as Partial<AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>>;
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

            await leaderboardController.getLeaderboard(
                req as AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>,
                res as Response,
                next
            );

            expect(mockUserService.getUsers).toHaveBeenCalledWith(10, undefined);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should get leaderboard with only offset and return status 200', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1600,
                    avatarUrl: 'avatar1.com'
                },
                query: {
                    offset: 5
                }
            } as Partial<AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>>;
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

            await leaderboardController.getLeaderboard(
                req as AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>,
                res as Response,
                next
            );

            expect(mockUserService.getUsers).toHaveBeenCalledWith(undefined, 5);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should get leaderboard with no query parameters and return status 200', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1600,
                    avatarUrl: 'avatar1.com'
                },
                query: {}
            } as Partial<AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>>;
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

            await leaderboardController.getLeaderboard(
                req as AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>,
                res as Response,
                next
            );

            expect(mockUserService.getUsers).toHaveBeenCalledWith(undefined, undefined);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should call next function with error when error is thrown', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1600,
                    avatarUrl: 'avatar1.com'
                },
                query: {
                    limit: 10,
                    offset: 5
                }
            } as Partial<AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>>;
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');

            mockUserService.getUsers.mockRejectedValue(expectedError);

            await leaderboardController.getLeaderboard(
                req as AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>,
                res as Response,
                next
            );

            expect(mockUserService.getUsers).toHaveBeenCalledWith(10, 5);
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
