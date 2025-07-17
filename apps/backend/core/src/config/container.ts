import { Container } from 'inversify';
import GameService from '../services/game.service';
import GameController from '../controllers/game.controller';
import GameStateRepository from '../repositories/gameState.repository';
import GameIdRepository from '../repositories/gameId.repository';

const container = new Container();

container.bind(GameStateRepository).toSelf().inSingletonScope();
container.bind(GameIdRepository).toSelf().inSingletonScope();
container.bind(GameService).toSelf().inSingletonScope();
container.bind(GameController).toSelf().inSingletonScope();

export default container;
