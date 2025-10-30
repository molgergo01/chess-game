import express from 'express';
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

// Middlewares
app.use(cors(corsConfig));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Internal Routes
app.use('/internal/auth', internalAuthRoutes);

// Error Handlers
app.use(authErrorHandler);
app.use(errorHandler);

export default app;
