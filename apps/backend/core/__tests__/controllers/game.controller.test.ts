import GameService from '../../src/services/game.service';
import GameController from '../../src/controllers/game.controller';
import TimerWatcher from '../../src/services/timer.watcher';
import { NextFunction, Request, Response } from 'express';
import { Color, GameCreated, GameHistoryResult, GameWithMoves, GameWithPlayers, Winner } from '../../src/models/game';
import { Player } from '../../src/models/player';
import { Timer } from '../../src/models/timer';
import { CreateGameResponse, GetGameHistoryResponse, GetGameResponse } from '../../src/models/responses';
import { User } from '../../src/models/user';
import { Move } from '../../src/models/move';
import { GetGameParams } from '../../src/models/requests';

jest.mock('../../src/services/game.service');
jest.mock('../../src/services/timer.watcher');
jest.mock('../../src/config/container');

describe('Game Controller', () => {
    let mockGameService: jest.Mocked<GameService>;
    let mockTimerWatcher: jest.Mocked<TimerWatcher>;
    let gameController: GameController;

    beforeEach(() => {
        mockGameService = new GameService(
            null as never,
            null as never,
            null as never,
            null as never
        ) as jest.Mocked<GameService>;
        mockGameService.create = jest.fn();
        mockGameService.getGameHistory = jest.fn();
        mockGameService.getGameWithMoves = jest.fn();

        mockTimerWatcher = new TimerWatcher(null as never, null as never, null as never) as jest.Mocked<TimerWatcher>;

        gameController = new GameController(mockGameService, mockTimerWatcher);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    const next: NextFunction = jest.fn();

    describe('Create game', () => {
        const req = {
            body: {
                players: ['1234', '5678']
            }
        } as Partial<Request>;
        it('should create a game and return status 201', async () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const player1: Player = {
                id: '1234',
                color: Color.WHITE,
                timer: new Timer()
            };
            const player2: Player = {
                id: '5678',
                color: Color.BLACK,
                timer: new Timer()
            };
            const gameId = '0000';
            const gameCreated: GameCreated = {
                players: [player1, player2],
                gameId: gameId
            };
            const expectedResponse: CreateGameResponse = {
                players: [player1, player2],
                gameId: gameId
            };

            mockGameService.create.mockResolvedValue(gameCreated);

            await gameController.createGame(req as Request, res as Response, next);

            expect(mockGameService.create).toHaveBeenCalledWith(req.body.players);
            expect(mockTimerWatcher.start).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should call next function with error when error is thrown', () => {
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');
            mockGameService.create.mockImplementation(() => {
                throw expectedError;
            });

            gameController.createGame(req as Request, res as Response, next);

            expect(mockGameService.create).toHaveBeenCalledWith(req.body.players);
            expect(next).toHaveBeenCalledWith(expectedError);
            expect(mockTimerWatcher.start).not.toHaveBeenCalled();
        });
    });

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
                query: {
                    userId: 'user1',
                    limit: '10',
                    offset: '0'
                }
            } as Partial<Request>;
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

            await gameController.getGameHistory(req as Request, res as Response, next);

            expect(mockGameService.getGameHistory).toHaveBeenCalledWith('user1', 10, 0);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should get game history with only userId and return status 200', async () => {
            const req = {
                query: {
                    userId: 'user1'
                }
            } as Partial<Request>;
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

            await gameController.getGameHistory(req as Request, res as Response, next);

            expect(mockGameService.getGameHistory).toHaveBeenCalledWith('user1', null, null);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 when userId is missing', async () => {
            const req = {
                query: {}
            } as Partial<Request>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            await gameController.getGameHistory(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'userId query parameter is required' });
            expect(mockGameService.getGameHistory).not.toHaveBeenCalled();
        });

        it('should return 400 when userId is not a string', async () => {
            const req = {
                query: {
                    userId: 123 as unknown
                }
            } as Partial<Request>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            await gameController.getGameHistory(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'userId query parameter is required' });
            expect(mockGameService.getGameHistory).not.toHaveBeenCalled();
        });

        it('should call next function with error when error is thrown', async () => {
            const req = {
                query: {
                    userId: 'user1'
                }
            } as Partial<Request>;
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');

            mockGameService.getGameHistory.mockRejectedValue(expectedError);

            await gameController.getGameHistory(req as Request, res as Response, next);

            expect(mockGameService.getGameHistory).toHaveBeenCalledWith('user1', null, null);
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
                params: {
                    gameId: 'game1'
                }
            } as Request<GetGameParams>;
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
                params: {
                    gameId: 'game1'
                }
            } as Request<GetGameParams>;
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');

            mockGameService.getGameWithMoves.mockRejectedValue(expectedError);

            await gameController.getGame(req, res as Response, next);

            expect(mockGameService.getGameWithMoves).toHaveBeenCalledWith('game1');
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
