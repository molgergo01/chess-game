import express from 'express';
import container from '../config/container';
import GameController from '../controllers/game.controller';

const gameController = container.get(GameController);
const router = express.Router();

router.post('/', gameController.createGame.bind(gameController));
router.get('/', gameController.getGameHistory.bind(gameController));
router.get('/active', gameController.getActiveGame.bind(gameController));
router.get('/:gameId', gameController.getGame.bind(gameController));

export default router;
