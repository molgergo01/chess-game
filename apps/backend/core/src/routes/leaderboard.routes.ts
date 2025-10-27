import LeaderboardController from '../controllers/leaderboard.controller';
import container from '../config/container';
import express from 'express';

const leaderboardController = container.get(LeaderboardController);
const router = express.Router();

router.get('/', leaderboardController.getLeaderboard.bind(leaderboardController));

export default router;
