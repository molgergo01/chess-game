import env from './env';

const corsConfig = {
    origin: `${env.FRONTEND_URL}`,
    credentials: true
};

export default corsConfig;
