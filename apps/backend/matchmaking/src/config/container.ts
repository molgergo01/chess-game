import { Container } from 'inversify';
import QueueRepository from '../repositories/queue.repository';
import MatchmakingService from '../services/matchmaking.service';
import MatchmakingController from '../controllers/matchmaking.controller';
import MatchmakingScheduler from '../scheduler/matchmaking.scheduler';
import SocketIdRepository from '../repositories/socketId.repository';
import CoreRestClient from '../clients/core.rest.client';
import MatchmakingNotificationService from '../services/matchmaking.notification.service';
import QueuedPlayerRepository from '../repositories/queuedPlayer.repository';
import AuthMiddleware from '../middlewares/auth.middleware';
import SocketAuthMiddleware from '../middlewares/socket.auth.middleware';

const container = new Container();

container.bind('Container').toConstantValue(container);

container.bind(CoreRestClient).toSelf().inSingletonScope();

container.bind(SocketIdRepository).toSelf().inSingletonScope();
container.bind(QueueRepository).toSelf().inSingletonScope();
container.bind(QueuedPlayerRepository).toSelf().inSingletonScope();
container.bind(MatchmakingNotificationService).toSelf().inSingletonScope();
container.bind(MatchmakingService).toSelf().inSingletonScope();
container.bind(MatchmakingController).toSelf().inSingletonScope();
container.bind(MatchmakingScheduler).toSelf().inSingletonScope();
container.bind(AuthMiddleware).toSelf().inSingletonScope();
container.bind(SocketAuthMiddleware).toSelf().inSingletonScope();

export default container;
