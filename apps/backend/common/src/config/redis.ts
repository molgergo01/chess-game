import { createClient } from 'redis';
import env from './env';
import { RedisTransactionManager } from '../transaction/redis-transaction-manager';

const redis = createClient({
    url: env.REDIS_URL,
    database: env.NODE_ENV === 'test' ? env.REDIS_TEST_DB : env.REDIS_DB
});

redis.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    await redis.connect();
})();

export const redisTransactionManager = new RedisTransactionManager(redis);

export default redis;
