import { redisTransactionContext } from './context';
import { RedisClient, RedisMulti, RedisTransactionContext } from './types';

export class RedisTransactionManager {
    constructor(private readonly redis: RedisClient) {}

    async executeInTransaction<T>(operation: () => Promise<T>): Promise<T> {
        const existingContext = redisTransactionContext.getStore();

        if (existingContext) {
            return operation();
        }

        const multi = this.redis.multi();
        const context: RedisTransactionContext = { multi: multi as RedisMulti };

        try {
            const result = await redisTransactionContext.run(context, operation);
            await multi.exec();
            return result;
        } catch (error) {
            console.log('Transaction error: ', error);
            throw error;
        }
    }

    getCurrentTransaction(): RedisTransactionContext | undefined {
        return redisTransactionContext.getStore();
    }
}
