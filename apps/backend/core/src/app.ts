import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'chess-game-backend-common/config/passport';
import corsConfig from 'chess-game-backend-common/config/cors';
import gameRoutes from './routes/game.routes';
import { errorHandler } from 'chess-game-backend-common/middlewares/error.handler';
import leaderboardRoutes from './routes/leaderboard.routes';
import internalGameRoutes from './routes/internal.game.routes';

const app = express();

// Middlewares
app.use(cors(corsConfig));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/games', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Internal Routes
app.use('/internal/games', internalGameRoutes);

// Error Handler
app.use(errorHandler);

export default app;
