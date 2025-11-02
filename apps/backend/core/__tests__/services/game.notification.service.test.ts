import GameNotificationService from '../../src/services/game.notification.service';
import { Server } from 'socket.io';
import { Container } from 'inversify';
import { Color, RatingChange, Winner } from '../../src/models/game';
import {
    DrawOfferedNotification,
    GameOverNotification,
    PositionUpdateNotification
} from '../../src/models/notifications';
import { PlayerTimes } from '../../src/models/player';

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

    describe('Send Game Over Notification', () => {
        const timeExpiredEvent = 'game-over';
        it('should send notification', () => {
            const gameId = '0000';
            const winner = Winner.WHITE;
            const ratingChange: RatingChange = {
                whiteRatingChange: 0,
                whiteNewRating: 400,
                blackRatingChange: 0,
                blackNewRating: 400
            };

            const expectedMessage: GameOverNotification = {
                winner: winner,
                ratingChange: ratingChange
            };

            gameNotificationService.sendGameOverNotification(gameId, winner, ratingChange);

            expect(mockIo.to).toHaveBeenCalledWith(gameId);
            expect(mockIo.emit).toHaveBeenCalledWith(timeExpiredEvent, expectedMessage);
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
            const ratingChange: RatingChange = {
                whiteRatingChange: 0,
                whiteNewRating: 400,
                blackRatingChange: 0,
                blackNewRating: 400
            };

            const expectedMessage: PositionUpdateNotification = {
                position: fen,
                isGameOver: isGameOver,
                winner: winner,
                playerTimes: playerTimes,
                ratingChange: ratingChange
            };

            gameNotificationService.sendPositionUpdateNotification(
                gameId,
                fen,
                isGameOver,
                winner,
                playerTimes,
                ratingChange
            );

            expect(mockIo.to).toHaveBeenCalledWith(gameId);
            expect(mockIo.emit).toHaveBeenCalledWith(updatePositionEvent, expectedMessage);
        });
    });

    describe('Send Draw Offered Notification', () => {
        const drawOfferedEvent = 'draw-offered';
        it('should send notification', () => {
            const gameId = '0000';
            const offeredBy = Color.WHITE;
            const expiresAt = new Date('2025-11-02T12:00:00Z');

            const expectedMessage: DrawOfferedNotification = {
                offeredBy: offeredBy,
                expiresAt: expiresAt
            };

            gameNotificationService.sendDrawOfferedNotification(gameId, offeredBy, expiresAt);

            expect(mockIo.to).toHaveBeenCalledWith(gameId);
            expect(mockIo.emit).toHaveBeenCalledWith(drawOfferedEvent, expectedMessage);
        });
    });

    describe('Send Draw Offer Rejected Notification', () => {
        const drawOfferRejectedEvent = 'draw-offer-rejected';
        it('should send notification', () => {
            const gameId = '0000';

            gameNotificationService.sendDrawOfferRejectedNotification(gameId);

            expect(mockIo.to).toHaveBeenCalledWith(gameId);
            expect(mockIo.emit).toHaveBeenCalledWith(drawOfferRejectedEvent, gameId);
        });
    });
});
