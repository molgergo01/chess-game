import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'chess-game-backend-common/config/passport';
import corsConfig from 'chess-game-backend-common/config/cors';
import matchmakingRoutes from './routes/matchmaking.routes';
import { errorHandler } from 'chess-game-backend-common/middlewares/error.handler';

const app = express();

// Middlewares
app.use(cors(corsConfig));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/matchmaking', matchmakingRoutes);

// Error handler
app.use(errorHandler);

export default app;
