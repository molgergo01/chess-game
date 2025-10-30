import { Container } from 'inversify';
import GameService from '../services/game.service';
import GameController from '../controllers/game.controller';
import GameStateRepository from '../repositories/gameState.repository';
import GameIdRepository from '../repositories/gameId.repository';
import TimerWatcher from '../services/timer.watcher';
import GameNotificationService from '../services/game.notification.service';
import redis from 'chess-game-backend-common/config/redis';
import GamesRepository from '../repositories/games.repository';
import MovesRepository from '../repositories/moves.repository';
import UsersRepository from '../repositories/users.repository';
import UserService from '../services/user.service';
import LeaderboardController from '../controllers/leaderboard.controller';
import RatingService from '../services/rating.service';
import AuthMiddleware from '../middlewares/auth.middleware';
import SocketAuthMiddleware from '../middlewares/socket.auth.middleware';
import InternalGameController from '../controllers/internal.game.controller';

const container = new Container();

container.bind('Container').toConstantValue(container);

container.bind('Redis').toConstantValue(redis);

container.bind(GameStateRepository).toSelf().inSingletonScope();
container.bind(GameIdRepository).toSelf().inSingletonScope();
container.bind(GamesRepository).toSelf().inSingletonScope();
container.bind(MovesRepository).toSelf().inSingletonScope();
container.bind(UsersRepository).toSelf().inSingletonScope();
container.bind(RatingService).toSelf().inSingletonScope();
container.bind(GameService).toSelf().inSingletonScope();
container.bind(UserService).toSelf().inSingletonScope();
container.bind(GameNotificationService).toSelf().inSingletonScope();
container.bind(TimerWatcher).toSelf().inSingletonScope();
container.bind(GameController).toSelf().inSingletonScope();
container.bind(LeaderboardController).toSelf().inSingletonScope();
container.bind(InternalGameController).toSelf().inSingletonScope();
container.bind(AuthMiddleware).toSelf().inSingletonScope();
container.bind(SocketAuthMiddleware).toSelf().inSingletonScope();

export default container;
