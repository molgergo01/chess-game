import express from 'express';
import container from '../config/container';
import MatchmakingController from '../controllers/matchmaking.controller';

const matchmakingController = container.get(MatchmakingController);
const router = express.Router();

router.post('/queue', matchmakingController.joinQueue.bind(matchmakingController));

router.post('/queue/private', matchmakingController.createPrivateQueue.bind(matchmakingController));

router.post('/queue/private/:queueId', matchmakingController.joinPrivateQueue.bind(matchmakingController));

router.delete('/queue', matchmakingController.leaveQueue.bind(matchmakingController));

router.delete('/queue/private/:queueId', matchmakingController.leavePrivateQueue.bind(matchmakingController));

router.get('/queue/status', matchmakingController.getQueueStatus.bind(matchmakingController));

export default router;
