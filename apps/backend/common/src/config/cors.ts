import env from './env';

const corsConfig = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (origin === env.FRONTEND_URL || (env.FRONTEND_URL && origin.startsWith(env.FRONTEND_URL))) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS']
};

export default corsConfig;
