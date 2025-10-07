import { Container, inject, injectable } from 'inversify';
import { Server } from 'socket.io';
import { PlayerTimes, PositionUpdateNotification, TimeExpiredMessage, Winner } from '../models/game';

@injectable()
class GameNotificationService {
    constructor(
        @inject('Container')
        private readonly container: Container
    ) {}

    private get io(): Server {
        return this.container.get<Server>('SocketIO');
    }

    sendTimerExpiredNotification(gameId: string, winner: Winner) {
        const message: TimeExpiredMessage = {
            winner: winner
        };
        this.io.to(gameId).emit('time-expired', message);
    }

    sendPositionUpdateNotification(
        gameId: string,
        fen: string,
        isGameOver: boolean,
        winner: Winner | null,
        playerTimes: PlayerTimes
    ) {
        const message: PositionUpdateNotification = {
            position: fen,
            isGameOver: isGameOver,
            winner: winner,
            playerTimes: playerTimes
        };
        this.io.to(gameId).emit('update-position', message);
    }
}

export default GameNotificationService;
