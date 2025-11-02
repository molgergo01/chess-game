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
        const message: GameOverNotification = {
            winner: winner,
            ratingChange: ratingChange
        };
        this.io.to(gameId).emit('game-over', message);
    }

    sendPositionUpdateNotification(
        gameId: string,
        fen: string,
        isGameOver: boolean,
        winner: Winner | null,
        playerTimes: PlayerTimes,
        ratingChange: RatingChange | null
    ) {
        const message: PositionUpdateNotification = {
            position: fen,
            isGameOver: isGameOver,
            winner: winner,
            playerTimes: playerTimes,
            ratingChange: ratingChange
        };
        this.io.to(gameId).emit('update-position', message);
    }

    sendDrawOfferedNotification(gameId: string, offeredBy: Color, expiresAt: Date) {
        const message: DrawOfferedNotification = {
            offeredBy: offeredBy,
            expiresAt: expiresAt
        };

        this.io.to(gameId).emit('draw-offered', message);
    }

    sendDrawOfferRejectedNotification(gameId: string) {
        this.io.to(gameId).emit('draw-offer-rejected', gameId);
    }
}

export default GameNotificationService;
