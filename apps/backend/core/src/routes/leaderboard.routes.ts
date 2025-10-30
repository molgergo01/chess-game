import LeaderboardController from '../controllers/leaderboard.controller';
import container from '../config/container';
import express, { RequestHandler } from 'express';
import AuthMiddleware from '../middlewares/auth.middleware';

const leaderboardController = container.get(LeaderboardController);
const authMiddleware = container.get(AuthMiddleware);
const router = express.Router();

router.get(
    '/',
    authMiddleware.authenticate.bind(authMiddleware),
    leaderboardController.getLeaderboard.bind(leaderboardController) as unknown as RequestHandler
);

export default router;
