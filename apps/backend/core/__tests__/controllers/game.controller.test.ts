import GameService from '../../src/services/game.service';
import GameController from '../../src/controllers/game.controller';
import TimerWatcher from '../../src/services/timer.watcher';
import { NextFunction, Request, Response } from 'express';
import { Color, CreateGameResponse, GameCreated } from '../../src/models/game';
import { Player } from '../../src/models/player';
import { Timer } from '../../src/models/timer';

jest.mock('../../src/services/game.service');
jest.mock('../../src/services/timer.watcher');
jest.mock('../../src/config/container');

describe('Game Controller', () => {
    let mockGameService: jest.Mocked<GameService>;
    let mockTimerWatcher: jest.Mocked<TimerWatcher>;
    let gameController: GameController;

    beforeEach(() => {
        mockGameService = new GameService(null as never, null as never) as jest.Mocked<GameService>;
        mockGameService.create = jest.fn();

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
});
