import express from 'express';
import container from '../config/container';
import InternalGameController from '../controllers/internal.game.controller';

const internalGameController = container.get(InternalGameController);
const router = express.Router();

router.post('/', internalGameController.createGame.bind(internalGameController));
router.get('/active', internalGameController.getActiveGame.bind(internalGameController));

export default router;
