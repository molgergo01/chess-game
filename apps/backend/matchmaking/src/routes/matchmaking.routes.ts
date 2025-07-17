import express from 'express';
import container from '../config/container';
import MatchmakingController from '../controllers/matchmaking.controller';

const matchmakingController = container.get(MatchmakingController);
const router = express.Router();

router.post(
    '/queue',
    matchmakingController.joinQueue.bind(matchmakingController)
);

router.delete(
    '/queue/:userId',
    matchmakingController.leaveQueue.bind(matchmakingController)
);

router.get(
    '/queue/:userId',
    matchmakingController.getIsInQueue.bind(matchmakingController)
);

export default router;
