import container from '../config/container';
import AuthMiddleware from '../middlewares/auth.middleware';
import express, { RequestHandler } from 'express';
import ChatController from '../controllers/chat.controller';

const chatController = container.get(ChatController);
const authMiddleware = container.get(AuthMiddleware);
const router = express.Router();

router.get(
    '/:chatId/messages',
    authMiddleware.authenticate.bind(authMiddleware),
    chatController.getChatMessages.bind(chatController) as RequestHandler
);

export default router;
