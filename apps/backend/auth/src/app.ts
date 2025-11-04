import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'chess-game-backend-common/config/passport';
import corsConfig from 'chess-game-backend-common/config/cors';
import authRoutes from './routes/auth.routes';
import { errorHandler } from 'chess-game-backend-common/middlewares/error.handler';
import { authErrorHandler } from './middlewares/auth.error.handler';
import userRoutes from './routes/user.routes';
import internalAuthRoutes from './routes/internal.auth.routes';

const app = express();

app.set('trust proxy', true);

// Middlewares
app.use(cors(corsConfig));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.get('/api/auth/health', (req: Request, res: Response) => {
    res.status(200).send({ healthy: true });
});
app.use('/api/auth', authRoutes);
app.use('/api/auth/user', userRoutes);

// Internal Routes
app.use('/internal/auth', internalAuthRoutes);

// Error Handlers
app.use(authErrorHandler);
app.use(errorHandler);

export default app;
