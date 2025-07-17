import { createClient } from 'redis';
import env from './env';

const redis = createClient({
    url: env.REDIS_URL
});

redis.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    await redis.connect();
})();

export default redis;
