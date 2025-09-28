import GameNotificationService from '../../src/services/game.notification.service';
import { Server } from 'socket.io';
import { Container } from 'inversify';
import {
    PlayerTimes,
    PositionUpdateNotification,
    TimeExpiredMessage,
    Winner
} from '../../src/models/game';

jest.mock('socket.io');

describe('Game Notification Service', () => {
    let mockContainer: jest.Mocked<Container>;
    let mockIo: jest.Mocked<Server>;
    let gameNotificationService: GameNotificationService;

    beforeEach(() => {
        mockIo = new Server() as jest.Mocked<Server>;
        mockIo.to = jest.fn().mockReturnThis();
        mockIo.emit = jest.fn().mockReturnThis();

        mockContainer = new Container() as jest.Mocked<Container>;
        mockContainer.get = jest.fn().mockReturnValue(mockIo);

        gameNotificationService = new GameNotificationService(mockContainer);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('Send Timer Expired Notification', () => {
        const timeExpiredEvent = 'time-expired';
        it('should send notification', () => {
            const gameId = '0000';
            const winner = Winner.WHITE;

            const expectedMessage: TimeExpiredMessage = {
                winner: winner
            };

            gameNotificationService.sendTimerExpiredNotification(
                gameId,
                winner
            );

            expect(mockIo.to).toHaveBeenCalledWith(gameId);
            expect(mockIo.emit).toHaveBeenCalledWith(
                timeExpiredEvent,
                expectedMessage
            );
        });
    });

    describe('Send Position Update Notification', () => {
        const updatePositionEvent = 'update-position';
        it('should send notification', () => {
            const gameId = '0000';
            const fen = 'fen';
            const isGameOver = true;
            const winner = Winner.WHITE;
            const playerTimes: PlayerTimes = {
                whiteTimeRemaining: 1,
                blackTimeRemaining: 1
            };

            const expectedMessage: PositionUpdateNotification = {
                position: fen,
                isGameOver: isGameOver,
                winner: winner,
                playerTimes: playerTimes
            };

            gameNotificationService.sendPositionUpdateNotification(
                gameId,
                fen,
                isGameOver,
                winner,
                playerTimes
            );

            expect(mockIo.to).toHaveBeenCalledWith(gameId);
            expect(mockIo.emit).toHaveBeenCalledWith(
                updatePositionEvent,
                expectedMessage
            );
        });
    });
});
