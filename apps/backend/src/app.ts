import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './config/passport';
import sessionConfig from './config/session';
import corsConfig from './config/cors';
import authRoutes from './routes/auth.routes';

const app = express();

// Middlewares
app.use(cors(corsConfig));
app.use(cookieParser());
app.use(express.json());
app.use(sessionConfig);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);

export default app;
