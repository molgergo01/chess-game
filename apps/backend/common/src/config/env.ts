import dotenv from 'dotenv';

dotenv.config();

const env = {
    PORTS: {
        CORE: process.env.CORE_PORT || 8080,
        MATCHMAKING: process.env.MATCHMAKING_PORT || 8081,
        AUTH: process.env.AUTH_PORT || 8082
    },
    JWT_SECRET: process.env.JWT_SECRET!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    NODE_ENV: process.env.NODE_ENV,
    FRONTEND_URL: process.env.FRONTEND_URL,
    DB_HOST: process.env.DB_HOST,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_TEST_DATABASE: process.env.DB_TEST_DATABASE,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    REDIS_URL: process.env.REDIS_URL,
    REDIS_DB: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
    REDIS_TEST_DB: process.env.REDIS_TEST_DB
        ? parseInt(process.env.REDIS_TEST_DB)
        : 1
};

export default env;
