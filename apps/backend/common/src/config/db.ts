import pgPromise from 'pg-promise';
import env from './env';

const pgp = pgPromise();

const config = {
    host: env.DB_HOST,
    port: 5432,
    database: env.NODE_ENV === 'test' ? env.DB_TEST_DATABASE : env.DB_DATABASE,
    user: env.DB_USER,
    password: env.DB_PASSWORD
};

console.log(env.NODE_ENV);

const db = pgp(config);

export default db;
