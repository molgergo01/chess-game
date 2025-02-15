import session from 'express-session';
import env from './env';

export const sessionConfig = session({
    secret: env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: env.NODE_ENV === 'production' }
});

export default sessionConfig;
