import { Container } from 'inversify';
import UserRepository from '../repositories/user.repository';
import AuthService from '../services/auth.service';
import AuthController from '../controllers/auth.controller';
import UserController from '../controllers/user.controller';
import InternalAuthController from '../controllers/internal.auth.controller';
import AuthMiddleware from '../middlewares/auth.middleware';

const container = new Container();

container.bind(UserRepository).toSelf().inSingletonScope();
container.bind(AuthService).toSelf().inSingletonScope();

container.bind(InternalAuthController).toSelf().inSingletonScope();
container.bind(AuthController).toSelf().inSingletonScope();
container.bind(UserController).toSelf().inSingletonScope();
container.bind(AuthMiddleware).toSelf().inSingletonScope();

export default container;
