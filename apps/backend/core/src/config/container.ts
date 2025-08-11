import { Container } from 'inversify';
import GameService from '../services/game.service';
import GameController from '../controllers/game.controller';
import GameStateRepository from '../repositories/gameState.repository';
import GameIdRepository from '../repositories/gameId.repository';
import TimerWatcher from '../services/timer.watcher';

const container = new Container();

container.bind(GameStateRepository).toSelf().inSingletonScope();
container.bind(GameIdRepository).toSelf().inSingletonScope();
container.bind(GameService).toSelf().inSingletonScope();
container.bind(TimerWatcher).toSelf().inSingletonScope();
container.bind(GameController).toSelf().inSingletonScope();

export default container;
