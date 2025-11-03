import TimerWatcher from '../../src/services/timer.watcher';
import GameStateRepository from '../../src/repositories/gameState.repository';
import GameService from '../../src/services/game.service';
import GameNotificationService from '../../src/services/game.notification.service';
import { Color, GameState, RatingChange, Winner } from '../../src/models/game';
import { Chess } from 'chess.js';
import { Player } from '../../src/models/player';
import { Timer } from '../../src/models/timer';
import { DEFAULT_START_TIMEOUT_IN_MINUTES } from '../../src/config/constants';

jest.mock('../../src/repositories/gameState.repository');
jest.mock('../../src/services/game.service');
jest.mock('../../src/services/game.notification.service');
jest.mock('chess.js');

describe('Timer Watcher', () => {
    const NOW = 10000000;

    let mockGameStateRepository: jest.Mocked<GameStateRepository>;
    let mockGameService: jest.Mocked<GameService>;
    let mockGameNotificationService: jest.Mocked<GameNotificationService>;
    let timerWatcher: TimerWatcher;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(NOW);
        jest.spyOn(global, 'setInterval');
        jest.spyOn(global, 'clearInterval');

        mockGameStateRepository = new GameStateRepository(null as never) as jest.Mocked<GameStateRepository>;
        mockGameStateRepository.getKeys = jest.fn();

        mockGameService = new GameService(
            null as never,
            null as never,
            null as never,
            null as never,
            null as never,
            null as never
        ) as jest.Mocked<GameService>;
        mockGameService.getGameState = jest.fn();
        mockGameService.reset = jest.fn();

        mockGameNotificationService = new GameNotificationService(
            null as never
        ) as jest.Mocked<GameNotificationService>;
        mockGameNotificationService.sendGameOverNotification = jest.fn();

        timerWatcher = new TimerWatcher(mockGameStateRepository, mockGameService, mockGameNotificationService);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('Start', () => {
        it('should start interval', () => {
            timerWatcher.start();

            expect(setInterval).toHaveBeenCalled();
        });

        it('should not start again if interval is already started', () => {
            const interval = setInterval(() => {});
            jest.resetAllMocks();
            timerWatcher = new TimerWatcher(
                mockGameStateRepository,
                mockGameService,
                mockGameNotificationService,
                interval
            );

            timerWatcher.start();

            expect(setInterval).not.toHaveBeenCalled();

            clearInterval(interval);
        });
    });

    describe('Interval', () => {
        it('should stop if no games are ongoing', async () => {
            mockGameStateRepository.getKeys.mockResolvedValue([]);

            timerWatcher.start();
            await jest.runAllTimersAsync();

            expect(clearInterval).toHaveBeenCalled();
        });

        it('should send notification with winner if timers expired since last move', async () => {
            const gameId = '1234';
            const gameStateKey = 'game-state:' + gameId;
            mockGameStateRepository.getKeys.mockResolvedValueOnce([gameStateKey]);
            mockGameStateRepository.getKeys.mockResolvedValueOnce([]);

            const player1: Player = {
                id: '1234',
                color: Color.WHITE,
                timer: new Timer(50)
            };

            const player2: Player = {
                id: '5678',
                color: Color.BLACK,
                timer: new Timer(50000)
            };

            const mockGame = new Chess() as jest.Mocked<Chess>;
            mockGame.turn = jest.fn();
            const gameState: GameState = {
                game: mockGame,
                players: [player1, player2],
                lastMoveEpoch: NOW - 100,
                startedAt: NOW - 200,
                drawOffer: undefined
            };

            mockGameService.getGameState.mockResolvedValue(gameState);
            mockGame.turn.mockReturnValue(Color.WHITE);

            const ratingChange: RatingChange = {
                whiteRatingChange: 0,
                whiteNewRating: 400,
                blackRatingChange: 0,
                blackNewRating: 400
            };
            mockGameService.reset.mockResolvedValue(ratingChange);

            timerWatcher.start();
            await jest.runAllTimersAsync();

            expect(mockGameService.reset).toHaveBeenCalledWith(gameId);
            expect(mockGameNotificationService.sendGameOverNotification).toHaveBeenCalledWith(
                gameId,
                Winner.BLACK,
                ratingChange
            );
            expect(clearInterval).toHaveBeenCalled();
        });

        it('should send draw notification sufficient time passes since start without move', async () => {
            const gameId = '1234';
            const gameStateKey = 'game-state:' + gameId;
            mockGameStateRepository.getKeys.mockResolvedValueOnce([gameStateKey]);
            mockGameStateRepository.getKeys.mockResolvedValueOnce([]);

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

            const mockGame = new Chess() as jest.Mocked<Chess>;
            const gameState: GameState = {
                game: mockGame,
                players: [player1, player2],
                lastMoveEpoch: 0,
                startedAt: NOW - (DEFAULT_START_TIMEOUT_IN_MINUTES * 60 * 1000 + 1),
                drawOffer: undefined
            };

            mockGameService.getGameState.mockResolvedValue(gameState);

            const ratingChange: RatingChange = {
                whiteRatingChange: 0,
                whiteNewRating: 400,
                blackRatingChange: 0,
                blackNewRating: 400
            };
            mockGameService.reset.mockResolvedValue(ratingChange);

            timerWatcher.start();
            await jest.runAllTimersAsync();

            expect(mockGameService.reset).toHaveBeenCalledWith(gameId);
            expect(mockGameNotificationService.sendGameOverNotification).toHaveBeenCalledWith(
                gameId,
                Winner.DRAW,
                ratingChange
            );
            expect(clearInterval).toHaveBeenCalled();
        });

        it('should not send notification if timers have not expired', async () => {
            const gameId = '1234';
            const gameStateKey = 'game-state:' + gameId;
            mockGameStateRepository.getKeys.mockResolvedValueOnce([gameStateKey]);
            mockGameStateRepository.getKeys.mockResolvedValueOnce([]);

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

            const mockGame = new Chess() as jest.Mocked<Chess>;
            mockGame.turn = jest.fn();
            const gameState: GameState = {
                game: mockGame,
                players: [player1, player2],
                lastMoveEpoch: NOW - 100,
                startedAt: NOW - 200,
                drawOffer: undefined
            };

            mockGameService.getGameState.mockResolvedValue(gameState);
            mockGame.turn.mockReturnValue(Color.WHITE);

            timerWatcher.start();
            await jest.runAllTimersAsync();

            expect(mockGameService.reset).not.toHaveBeenCalled();
            expect(mockGameNotificationService.sendGameOverNotification).not.toHaveBeenCalled();
        });

        it('should log error and continue when getGameState fails', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const gameId = '1234';
            const gameStateKey = 'game-state:' + gameId;
            mockGameStateRepository.getKeys.mockResolvedValueOnce([gameStateKey]);
            mockGameStateRepository.getKeys.mockResolvedValueOnce([]);

            mockGameService.getGameState.mockRejectedValue(new Error('Failed to get game state'));

            timerWatcher.start();
            await jest.runAllTimersAsync();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                `timer checking failed for game state ${gameStateKey}`,
                expect.any(Error)
            );
            expect(mockGameService.reset).not.toHaveBeenCalled();
            expect(mockGameNotificationService.sendGameOverNotification).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should log error and continue when reset fails', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const gameId = '1234';
            const gameStateKey = 'game-state:' + gameId;
            mockGameStateRepository.getKeys.mockResolvedValueOnce([gameStateKey]);
            mockGameStateRepository.getKeys.mockResolvedValueOnce([]);

            const player1: Player = {
                id: '1234',
                color: Color.WHITE,
                timer: new Timer(50)
            };

            const player2: Player = {
                id: '5678',
                color: Color.BLACK,
                timer: new Timer(50000)
            };

            const mockGame = new Chess() as jest.Mocked<Chess>;
            mockGame.turn = jest.fn();
            const gameState: GameState = {
                game: mockGame,
                players: [player1, player2],
                lastMoveEpoch: NOW - 100,
                startedAt: NOW - 200,
                drawOffer: undefined
            };

            mockGameService.getGameState.mockResolvedValue(gameState);
            mockGame.turn.mockReturnValue(Color.WHITE);
            mockGameService.reset.mockRejectedValue(new Error('Failed to reset game'));

            timerWatcher.start();
            await jest.runAllTimersAsync();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                `timer checking failed for game state ${gameStateKey}`,
                expect.any(Error)
            );
            expect(mockGameNotificationService.sendGameOverNotification).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should continue checking other games when one game fails', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const gameId1 = '1234';
            const gameId2 = '5678';
            const gameStateKey1 = 'game-state:' + gameId1;
            const gameStateKey2 = 'game-state:' + gameId2;
            mockGameStateRepository.getKeys.mockResolvedValueOnce([gameStateKey1, gameStateKey2]);
            mockGameStateRepository.getKeys.mockResolvedValueOnce([]);

            mockGameService.getGameState.mockRejectedValueOnce(new Error('Failed for game 1'));

            const player1: Player = {
                id: '1234',
                color: Color.WHITE,
                timer: new Timer(50)
            };

            const player2: Player = {
                id: '5678',
                color: Color.BLACK,
                timer: new Timer(50000)
            };

            const mockGame = new Chess() as jest.Mocked<Chess>;
            mockGame.turn = jest.fn();
            const gameState: GameState = {
                game: mockGame,
                players: [player1, player2],
                lastMoveEpoch: NOW - 100,
                startedAt: NOW - 200,
                drawOffer: undefined
            };

            mockGameService.getGameState.mockResolvedValueOnce(gameState);
            mockGame.turn.mockReturnValue(Color.WHITE);

            const ratingChange: RatingChange = {
                whiteRatingChange: 0,
                whiteNewRating: 400,
                blackRatingChange: 0,
                blackNewRating: 400
            };
            mockGameService.reset.mockResolvedValue(ratingChange);

            timerWatcher.start();
            await jest.runAllTimersAsync();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                `timer checking failed for game state ${gameStateKey1}`,
                expect.any(Error)
            );
            expect(mockGameService.reset).toHaveBeenCalledWith(gameId2);
            expect(mockGameNotificationService.sendGameOverNotification).toHaveBeenCalledWith(
                gameId2,
                Winner.BLACK,
                ratingChange
            );

            consoleErrorSpy.mockRestore();
        });
    });
});
