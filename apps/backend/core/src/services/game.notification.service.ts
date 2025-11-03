import { Container, inject, injectable } from 'inversify';
import { Server } from 'socket.io';
import { Color, RatingChange, Winner } from '../models/game';
import { DrawOfferedNotification, GameOverNotification, PositionUpdateNotification } from '../models/notifications';
import { PlayerTimes } from '../models/player';

@injectable()
class GameNotificationService {
    constructor(
        @inject('Container')
        private readonly container: Container
    ) {}

    private get io(): Server {
        return this.container.get<Server>('SocketIO');
    }

    sendGameOverNotification(gameId: string, winner: Winner, ratingChange: RatingChange) {
        try {
            const message: GameOverNotification = {
                winner: winner,
                ratingChange: ratingChange
            };
            this.io.to(gameId).emit('game-over', message);
        } catch (error) {
            console.error(
                `[sendGameOverNotification] Failed to emit game-over notification (gameId=${gameId}):`,
                (error as Error).message
            );
        }
    }

    sendPositionUpdateNotification(
        gameId: string,
        fen: string,
        isGameOver: boolean,
        winner: Winner | null,
        playerTimes: PlayerTimes,
        ratingChange: RatingChange | null
    ) {
        try {
            const message: PositionUpdateNotification = {
                position: fen,
                isGameOver: isGameOver,
                winner: winner,
                playerTimes: playerTimes,
                ratingChange: ratingChange
            };
            this.io.to(gameId).emit('update-position', message);
        } catch (error) {
            console.error(
                `[sendPositionUpdateNotification] Failed to emit update-position notification (gameId=${gameId}):`,
                (error as Error).message
            );
        }
    }

    sendDrawOfferedNotification(gameId: string, offeredBy: Color, expiresAt: Date) {
        try {
            const message: DrawOfferedNotification = {
                offeredBy: offeredBy,
                expiresAt: expiresAt
            };

            this.io.to(gameId).emit('draw-offered', message);
        } catch (error) {
            console.error(
                `[sendDrawOfferedNotification] Failed to emit draw-offered notification (gameId=${gameId}):`,
                (error as Error).message
            );
        }
    }

    sendDrawOfferRejectedNotification(gameId: string) {
        try {
            this.io.to(gameId).emit('draw-offer-rejected', gameId);
        } catch (error) {
            console.error(
                `[sendDrawOfferRejectedNotification] Failed to emit draw-offer-rejected notification (gameId=${gameId}):`,
                (error as Error).message
            );
        }
    }
}

export default GameNotificationService;
