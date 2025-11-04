import dotenv from 'dotenv';
import type { Knex } from 'knex';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
    dev: {
        client: 'postgresql',
        connection: {
            database: process.env.DB_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        }
    },
    test: {
        client: 'postgresql',
        connection: {
            database: process.env.DB_TEST_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        }
    },

    staging: {
        client: 'postgresql',
        connection: {
            database: 'my_db',
            user: 'username',
            password: 'password'
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    },

    production: {
        client: 'postgresql',
        connection: {
            host: process.env.DB_HOST,
            port: 5432,
            database: process.env.DB_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    }
};

export default config;
