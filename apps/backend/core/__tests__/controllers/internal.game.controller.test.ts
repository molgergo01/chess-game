import GameService from '../../src/services/game.service';
import TimerWatcher from '../../src/services/timer.watcher';
import { NextFunction, Request, Response } from 'express';
import InternalGameController from '../../src/controllers/internal.game.controller';
import { Player } from '../../src/models/player';
import { Timer } from '../../src/models/timer';
import { ActiveGame, Color, DrawOffer, GameCreated, GameWithPlayers } from '../../src/models/game';
import { CreateGameResponse, GetActiveGameResponse } from '../../src/models/responses';
import { User } from '../../src/models/user';
import { InternalGetActiveGameQueryParams } from '../../src/models/requests';

jest.mock('../../src/services/game.service');
jest.mock('../../src/services/timer.watcher');
jest.mock('../../src/config/container');

describe('Internal Game Controller', () => {
    let mockGameService: jest.Mocked<GameService>;
    let mockTimerWatcher: jest.Mocked<TimerWatcher>;
    let gameController: InternalGameController;

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

        mockTimerWatcher = new TimerWatcher(null as never, null as never, null as never) as jest.Mocked<TimerWatcher>;

        gameController = new InternalGameController(mockGameService, mockTimerWatcher);
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
                query: {
                    userId: 'user1'
                }
            } as Partial<Request>;
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

            await gameController.getActiveGame(
                req as Request<unknown, unknown, unknown, InternalGetActiveGameQueryParams>,
                res as Response,
                next
            );

            expect(mockGameService.getActiveGame).toHaveBeenCalledWith('user1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should call next function with error when error is thrown', async () => {
            const req = {
                query: {
                    userId: 'user1'
                }
            } as Partial<Request>;
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');

            mockGameService.getActiveGame.mockRejectedValue(expectedError);

            await gameController.getActiveGame(
                req as Request<unknown, unknown, unknown, InternalGetActiveGameQueryParams>,
                res as Response,
                next
            );

            expect(mockGameService.getActiveGame).toHaveBeenCalledWith('user1');
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
