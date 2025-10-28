import { Container, inject, injectable } from 'inversify';
import { Server } from 'socket.io';
import { MatchmakeMessage } from '../models/matchmaking';

@injectable()
class MatchmakingNotificationService {
    constructor(
        @inject('Container')
        private readonly container: Container
    ) {}

    private get io(): Server {
        return this.container.get<Server>('SocketIO');
    }

    sendMatchmakeNotification(socketId: string, gameId: string) {
        const matchmakeMessage: MatchmakeMessage = {
            gameId: gameId
        };
        this.io.to(socketId).emit('matchmake', matchmakeMessage);
    }
}

export default MatchmakingNotificationService;
