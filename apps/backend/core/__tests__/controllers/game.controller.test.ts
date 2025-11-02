import GameService from '../../src/services/game.service';
import GameController from '../../src/controllers/game.controller';
import { NextFunction, Response } from 'express';
import {
    ActiveGame,
    Color,
    DrawOffer,
    GameHistoryResult,
    GameWithMoves,
    GameWithPlayers,
    Winner
} from '../../src/models/game';
import { GetActiveGameResponse, GetGameHistoryResponse, GetGameResponse } from '../../src/models/responses';
import { User } from '../../src/models/user';
import { Move } from '../../src/models/move';
import { GetGameParams, PaginationQueryParams } from '../../src/models/requests';
import { AuthenticatedRequest } from 'chess-game-backend-common/types/authenticated.request';

jest.mock('../../src/services/game.service');
jest.mock('../../src/config/container');

describe('Game Controller', () => {
    let mockGameService: jest.Mocked<GameService>;
    let gameController: GameController;

    beforeEach(() => {
        mockGameService = new GameService(
            null as never,
            null as never,
            null as never,
            null as never,
            null as never,
            null as never
        ) as jest.Mocked<GameService>;
        mockGameService.getGameHistory = jest.fn();
        mockGameService.getGameWithMoves = jest.fn();
        mockGameService.getActiveGame = jest.fn();

        gameController = new GameController(mockGameService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    const next: NextFunction = jest.fn();

    describe('Get game history', () => {
        const whitePlayer: User = {
            id: 'user1',
            name: 'Player One',
            email: 'player1@example.com',
            elo: 1500,
            avatarUrl: 'avatar_url.com'
        };
        const blackPlayer: User = {
            id: 'user2',
            name: 'Player Two',
            email: 'player2@example.com',
            elo: 1600,
            avatarUrl: 'avatar_url.com'
        };

        it('should get game history with all query parameters and return status 200', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                query: {
                    limit: 10,
                    offset: 0
                }
            } as Partial<AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const game1: GameWithPlayers = {
                id: 'game1',
                whitePlayer,
                blackPlayer,
                startedAt: new Date('2024-01-01'),
                endedAt: new Date('2024-01-01'),
                winner: Winner.WHITE
            };
            const game2: GameWithPlayers = {
                id: 'game2',
                whitePlayer,
                blackPlayer,
                startedAt: new Date('2024-01-02'),
                endedAt: new Date('2024-01-02'),
                winner: Winner.BLACK
            };
            const historyResult: GameHistoryResult = {
                games: [game1, game2],
                totalCount: 2
            };
            const expectedResponse: GetGameHistoryResponse = {
                games: [
                    {
                        gameId: 'game1',
                        whitePlayer: { userId: 'user1', name: 'Player One', elo: 1500, avatarUrl: 'avatar_url.com' },
                        blackPlayer: { userId: 'user2', name: 'Player Two', elo: 1600, avatarUrl: 'avatar_url.com' },
                        startedAt: new Date('2024-01-01'),
                        endedAt: new Date('2024-01-01'),
                        winner: Winner.WHITE
                    },
                    {
                        gameId: 'game2',
                        whitePlayer: { userId: 'user1', name: 'Player One', elo: 1500, avatarUrl: 'avatar_url.com' },
                        blackPlayer: { userId: 'user2', name: 'Player Two', elo: 1600, avatarUrl: 'avatar_url.com' },
                        startedAt: new Date('2024-01-02'),
                        endedAt: new Date('2024-01-02'),
                        winner: Winner.BLACK
                    }
                ],
                totalCount: 2
            };

            mockGameService.getGameHistory.mockResolvedValue(historyResult);

            await gameController.getGameHistory(
                req as AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>,
                res as Response,
                next
            );

            expect(mockGameService.getGameHistory).toHaveBeenCalledWith('user1', 10, 0);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should get game history with only user and return status 200', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                query: {}
            } as Partial<AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const game: GameWithPlayers = {
                id: 'game1',
                whitePlayer,
                blackPlayer,
                startedAt: new Date('2024-01-01'),
                endedAt: new Date('2024-01-01'),
                winner: Winner.DRAW
            };
            const historyResult: GameHistoryResult = {
                games: [game],
                totalCount: 1
            };

            mockGameService.getGameHistory.mockResolvedValue(historyResult);

            await gameController.getGameHistory(
                req as AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>,
                res as Response,
                next
            );

            expect(mockGameService.getGameHistory).toHaveBeenCalledWith('user1', undefined, undefined);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should call next function with error when error is thrown', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                query: {}
            } as Partial<AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>>;
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');

            mockGameService.getGameHistory.mockRejectedValue(expectedError);

            await gameController.getGameHistory(
                req as AuthenticatedRequest<unknown, unknown, unknown, PaginationQueryParams>,
                res as Response,
                next
            );

            expect(mockGameService.getGameHistory).toHaveBeenCalledWith('user1', undefined, undefined);
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });

    describe('Get game', () => {
        const whitePlayer: User = {
            id: 'user1',
            name: 'Player One',
            email: 'player1@example.com',
            elo: 1500,
            avatarUrl: 'avatar_url.com'
        };
        const blackPlayer: User = {
            id: 'user2',
            name: 'Player Two',
            email: 'player2@example.com',
            elo: 1600,
            avatarUrl: 'avatar_url.com'
        };

        it('should get game with moves and return status 200', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                params: {
                    gameId: 'game1'
                }
            } as AuthenticatedRequest<GetGameParams>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const move1: Move = {
                id: 'move1',
                gameId: 'game1',
                moveNumber: 1,
                playerColor: Color.WHITE,
                moveNotation: 'e4',
                positionFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                whitePlayerTime: 600000,
                blackPlayerTime: 600000,
                createdAt: new Date('2024-01-01')
            };
            const move2: Move = {
                id: 'move2',
                gameId: 'game1',
                moveNumber: 2,
                playerColor: Color.BLACK,
                moveNotation: 'e5',
                positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
                whitePlayerTime: 595000,
                blackPlayerTime: 595000,
                createdAt: new Date('2024-01-01')
            };
            const gameWithMoves: GameWithMoves = {
                id: 'game1',
                whitePlayer,
                blackPlayer,
                startedAt: new Date('2024-01-01'),
                endedAt: new Date('2024-01-01'),
                winner: Winner.WHITE,
                moves: [move1, move2]
            };
            const expectedResponse: GetGameResponse = {
                gameId: 'game1',
                whitePlayer: { userId: 'user1', name: 'Player One', elo: 1500, avatarUrl: 'avatar_url.com' },
                blackPlayer: { userId: 'user2', name: 'Player Two', elo: 1600, avatarUrl: 'avatar_url.com' },
                startedAt: new Date('2024-01-01'),
                endedAt: new Date('2024-01-01'),
                winner: Winner.WHITE,
                moves: [
                    {
                        moveNumber: 1,
                        playerColor: Color.WHITE,
                        moveNotation: 'e4',
                        positionFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                        whitePlayerTime: 600000,
                        blackPlayerTime: 600000
                    },
                    {
                        moveNumber: 2,
                        playerColor: Color.BLACK,
                        moveNotation: 'e5',
                        positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
                        whitePlayerTime: 595000,
                        blackPlayerTime: 595000
                    }
                ]
            };

            mockGameService.getGameWithMoves.mockResolvedValue(gameWithMoves);

            await gameController.getGame(req, res as Response, next);

            expect(mockGameService.getGameWithMoves).toHaveBeenCalledWith('game1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should call next function with error when error is thrown', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                params: {
                    gameId: 'game1'
                }
            } as AuthenticatedRequest<GetGameParams>;
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');

            mockGameService.getGameWithMoves.mockRejectedValue(expectedError);

            await gameController.getGame(req, res as Response, next);

            expect(mockGameService.getGameWithMoves).toHaveBeenCalledWith('game1');
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });

    describe('Get active game', () => {
        const whitePlayer: User = {
            id: 'user1',
            name: 'Player One',
            email: 'player1@example.com',
            elo: 1500,
            avatarUrl: 'avatar_url.com'
        };
        const blackPlayer: User = {
            id: 'user2',
            name: 'Player Two',
            email: 'player2@example.com',
            elo: 1600,
            avatarUrl: 'avatar_url.com'
        };

        it('should get active game and return status 200', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                }
            } as Partial<AuthenticatedRequest>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const gameWithPlayers: GameWithPlayers = {
                id: 'game1',
                whitePlayer,
                blackPlayer,
                startedAt: new Date('2024-01-01'),
                endedAt: null,
                winner: null
            };
            const drawOffer: DrawOffer = {
                offeredBy: Color.BLACK,
                expiresAt: new Date('2025-12-01')
            };
            const activeGameResult: ActiveGame = {
                game: gameWithPlayers,
                position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000,
                gameOver: false,
                winner: null,
                drawOffer: drawOffer,
                timeUntilAbandoned: 10000
            };
            const expectedResponse: GetActiveGameResponse = {
                gameId: 'game1',
                whitePlayer: { userId: 'user1', name: 'Player One', elo: 1500, avatarUrl: 'avatar_url.com' },
                blackPlayer: { userId: 'user2', name: 'Player Two', elo: 1600, avatarUrl: 'avatar_url.com' },
                position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000,
                gameOver: false,
                winner: null,
                drawOffer: drawOffer,
                timeUntilAbandoned: 10000
            };

            mockGameService.getActiveGame.mockResolvedValue(activeGameResult);

            await gameController.getActiveGame(req as AuthenticatedRequest, res as Response, next);

            expect(mockGameService.getActiveGame).toHaveBeenCalledWith('user1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should call next function with error when error is thrown', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                }
            } as Partial<AuthenticatedRequest>;
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');

            mockGameService.getActiveGame.mockRejectedValue(expectedError);

            await gameController.getActiveGame(req as AuthenticatedRequest, res as Response, next);

            expect(mockGameService.getActiveGame).toHaveBeenCalledWith('user1');
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
