import TimerWatcher from '../../src/services/timer.watcher';
import GameStateRepository from '../../src/repositories/gameState.repository';
import GameService from '../../src/services/game.service';
import GameNotificationService from '../../src/services/game.notification.service';
import { Color, GameState, Winner } from '../../src/models/game';
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

        mockGameStateRepository = new GameStateRepository(
            null as never
        ) as jest.Mocked<GameStateRepository>;
        mockGameStateRepository.getKeys = jest.fn();

        mockGameService = new GameService(
            null as never,
            null as never
        ) as jest.Mocked<GameService>;
        mockGameService.getGameState = jest.fn();
        mockGameService.getGameState = jest.fn();

        mockGameNotificationService = new GameNotificationService(
            null as never
        ) as jest.Mocked<GameNotificationService>;
        mockGameNotificationService.sendTimerExpiredNotification = jest.fn();

        timerWatcher = new TimerWatcher(
            mockGameStateRepository,
            mockGameService,
            mockGameNotificationService
        );
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
            mockGameStateRepository.getKeys.mockResolvedValueOnce([
                gameStateKey
            ]);
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
                startedAt: NOW - 200
            };

            mockGameService.getGameState.mockResolvedValue(gameState);
            mockGame.turn.mockReturnValue(Color.WHITE);

            timerWatcher.start();
            await jest.runAllTimersAsync();

            expect(mockGameService.reset).toHaveBeenCalledWith(gameId);
            expect(
                mockGameNotificationService.sendTimerExpiredNotification
            ).toHaveBeenCalledWith(gameId, Winner.BLACK);
            expect(clearInterval).toHaveBeenCalled();
        });

        it('should send draw notification sufficient time passes since start without move', async () => {
            const gameId = '1234';
            const gameStateKey = 'game-state:' + gameId;
            mockGameStateRepository.getKeys.mockResolvedValueOnce([
                gameStateKey
            ]);
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
                startedAt:
                    NOW - (DEFAULT_START_TIMEOUT_IN_MINUTES * 60 * 1000 + 1)
            };

            mockGameService.getGameState.mockResolvedValue(gameState);

            timerWatcher.start();
            await jest.runAllTimersAsync();

            expect(mockGameService.reset).toHaveBeenCalledWith(gameId);
            expect(
                mockGameNotificationService.sendTimerExpiredNotification
            ).toHaveBeenCalledWith(gameId, Winner.DRAW);
            expect(clearInterval).toHaveBeenCalled();
        });

        it('should not send notification if timers have not expired', async () => {
            const gameId = '1234';
            const gameStateKey = 'game-state:' + gameId;
            mockGameStateRepository.getKeys.mockResolvedValueOnce([
                gameStateKey
            ]);
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
                startedAt: NOW - 200
            };

            mockGameService.getGameState.mockResolvedValue(gameState);
            mockGame.turn.mockReturnValue(Color.WHITE);

            timerWatcher.start();
            await jest.runAllTimersAsync();

            expect(mockGameService.reset).not.toHaveBeenCalled();
            expect(
                mockGameNotificationService.sendTimerExpiredNotification
            ).not.toHaveBeenCalled();
        });
    });
});
