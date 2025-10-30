import express, { RequestHandler } from 'express';
import container from '../config/container';
import MatchmakingController from '../controllers/matchmaking.controller';
import AuthMiddleware from '../middlewares/auth.middleware';

const matchmakingController = container.get(MatchmakingController);
const authMiddleware = container.get(AuthMiddleware);
const router = express.Router();

router.post(
    '/queue',
    authMiddleware.authenticate.bind(authMiddleware),
    matchmakingController.joinQueue.bind(matchmakingController) as RequestHandler
);

router.post(
    '/queue/private',
    authMiddleware.authenticate.bind(authMiddleware),
    matchmakingController.createPrivateQueue.bind(matchmakingController) as RequestHandler
);

router.post(
    '/queue/private/:queueId',
    authMiddleware.authenticate.bind(authMiddleware),
    matchmakingController.joinPrivateQueue.bind(matchmakingController) as RequestHandler
);

router.delete(
    '/queue',
    authMiddleware.authenticate.bind(authMiddleware),
    matchmakingController.leaveQueue.bind(matchmakingController) as RequestHandler
);

router.delete(
    '/queue/private/:queueId',
    authMiddleware.authenticate.bind(authMiddleware),
    matchmakingController.leavePrivateQueue.bind(matchmakingController) as RequestHandler
);

router.get(
    '/queue/status',
    authMiddleware.authenticate.bind(authMiddleware),
    matchmakingController.getQueueStatus.bind(matchmakingController) as RequestHandler
);

export default router;
