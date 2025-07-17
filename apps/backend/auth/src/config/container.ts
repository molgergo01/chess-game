import { Container } from 'inversify';
import UserRepository from '../repositories/user.repository';
import AuthService from '../services/auth.service';
import AuthController from '../controllers/auth.controller';
import UserController from '../controllers/user.controller';

const container = new Container();

container.bind(UserRepository).toSelf().inSingletonScope();
container.bind(AuthService).toSelf().inSingletonScope();
container.bind(AuthController).toSelf().inSingletonScope();

container.bind(UserController).toSelf().inSingletonScope();

export default container;
