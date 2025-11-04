import { getRedisTransactionContext } from './context';
import { RedisClient, RedisMulti } from './types';

export function getRedisConnection(redis: RedisClient): RedisMulti | RedisClient {
    const context = getRedisTransactionContext();
    return (context?.multi as unknown as RedisMulti) ?? redis;
}
