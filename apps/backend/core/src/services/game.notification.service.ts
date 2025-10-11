import { Container, inject, injectable } from 'inversify';
import { Server } from 'socket.io';
import { Winner } from '../models/game';
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

    sendTimerExpiredNotification(gameId: string, winner: Winner) {
        const message: TimeExpiredNotification = {
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
