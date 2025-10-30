import { Container, inject, injectable } from 'inversify';
import { Server } from 'socket.io';
import { RatingChange, Winner } from '../models/game';
import { PositionUpdateNotification, TimeExpiredNotification } from '../models/notifications';
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

    sendTimerExpiredNotification(gameId: string, winner: Winner, ratingChange: RatingChange) {
        const message: TimeExpiredNotification = {
            winner: winner,
            ratingChange: ratingChange
        };
        this.io.to(gameId).emit('time-expired', message);
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
}

export default GameNotificationService;
