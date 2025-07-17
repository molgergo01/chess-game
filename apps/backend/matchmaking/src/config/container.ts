import { Container } from 'inversify';
import QueueRepository from '../repositories/queue.repository';
import MatchmakingService from '../services/matchmaking.service';
import MatchmakingController from '../controllers/matchmaking.controller';
import MatchmakingScheduler from '../scheduler/matchmaking.scheduler';
import { SocketIdRepository } from '../repositories/socket.id.repository';
import CoreRestClient from '../clients/core.rest.client';

const container = new Container();

container.bind(CoreRestClient).toSelf().inSingletonScope();

container.bind(SocketIdRepository).toSelf().inSingletonScope();
container.bind(QueueRepository).toSelf().inSingletonScope();
container.bind(MatchmakingService).toSelf().inSingletonScope();
container.bind(MatchmakingController).toSelf().inSingletonScope();
container.bind(MatchmakingScheduler).toSelf().inSingletonScope();

export default container;
