import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'chess-game-backend-common/config/passport';
import corsConfig from 'chess-game-backend-common/config/cors';
import gameRoutes from './routes/game.routes';
import { errorHandler } from 'chess-game-backend-common/middlewares/error.handler';
import leaderboardRoutes from './routes/leaderboard.routes';
import internalGameRoutes from './routes/internal.game.routes';
import chatRoutes from './routes/chat.routes';

const app = express();

app.set('trust proxy', true);

// Middlewares
app.use(cors(corsConfig));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

app.get('/api/core/health', (req: Request, res: Response) => {
    res.status(200).send({ healthy: true });
});

// Routes
app.use('/api/core/games', gameRoutes);
app.use('/api/core/leaderboard', leaderboardRoutes);
app.use('/api/core/chat', chatRoutes);

// Internal Routes
app.use('/internal/games', internalGameRoutes);

// Error Handler
app.use(errorHandler);

export default app;
