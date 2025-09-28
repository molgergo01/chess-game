import { createClient } from 'redis';
import env from './env';

const redis = createClient({
    url: env.REDIS_URL,
    database: env.NODE_ENV === 'test' ? env.REDIS_TEST_DB : env.REDIS_DB
});

redis.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    await redis.connect();
})();

export default redis;
