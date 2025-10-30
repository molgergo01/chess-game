import { Container, inject, injectable } from 'inversify';
import { Server } from 'socket.io';

@injectable()
class MatchmakingNotificationService {
    constructor(
        @inject('Container')
        private readonly container: Container
    ) {}

    private get io(): Server {
        return this.container.get<Server>('SocketIO');
    }

    sendMatchmakeNotification(socketId: string) {
        this.io.to(socketId).emit('matchmake');
    }
}

export default MatchmakingNotificationService;
