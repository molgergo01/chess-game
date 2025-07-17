import pgPromise from 'pg-promise';
import env from './env';

const pgp = pgPromise();

const dev = {
    host: env.DB_HOST,
    port: 5432,
    database: env.DB_DATABASE,
    user: env.DB_USER,
    password: env.DB_PASSWORD
};

const db = pgp(dev);

export default db;
