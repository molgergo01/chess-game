import { AsyncLocalStorage } from 'async_hooks';
import { TransactionContext, RedisTransactionContext } from './types';

export const dbTransactionContext = new AsyncLocalStorage<TransactionContext>();

export const redisTransactionContext = new AsyncLocalStorage<RedisTransactionContext>();

export function getDbTransactionContext(): TransactionContext | undefined {
    return dbTransactionContext.getStore();
}

export function getRedisTransactionContext(): RedisTransactionContext | undefined {
    return redisTransactionContext.getStore();
}
