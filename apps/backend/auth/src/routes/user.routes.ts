import express from 'express';
import UserController from '../controllers/user.controller';
import container from '../config/container';

const userController = container.get(UserController);
const router = express.Router();

router.get('/me', userController.getMe.bind(userController));

export default router;
