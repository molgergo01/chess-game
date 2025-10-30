import express, { RequestHandler } from 'express';
import container from '../config/container';
import GameController from '../controllers/game.controller';
import AuthMiddleware from '../middlewares/auth.middleware';

const gameController = container.get(GameController);
const authMiddleware = container.get(AuthMiddleware);
const router = express.Router();

router.get(
    '/',
    authMiddleware.authenticate.bind(authMiddleware),
    gameController.getGameHistory.bind(gameController) as unknown as RequestHandler
);
router.get(
    '/active',
    authMiddleware.authenticate.bind(authMiddleware),
    gameController.getActiveGame.bind(gameController) as RequestHandler
);
router.get(
    '/:gameId',
    authMiddleware.authenticate.bind(authMiddleware),
    gameController.getGame.bind(gameController) as RequestHandler
);

export default router;
