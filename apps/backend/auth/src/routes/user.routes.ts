import express, { RequestHandler } from 'express';
import UserController from '../controllers/user.controller';
import container from '../config/container';
import AuthMiddleware from '../middlewares/auth.middleware';

const userController = container.get(UserController);
const authMiddleware = container.get(AuthMiddleware);
const router = express.Router();

router.get(
    '/me',
    authMiddleware.authenticate.bind(authMiddleware),
    userController.getMe.bind(userController) as RequestHandler
);

export default router;
