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

            if (context.afterCommitCallbacks) {
                for (const callback of context.afterCommitCallbacks) {
                    await callback();
                }
            }

            return result;
        } catch (error) {
            console.log('Transaction error: ', error);
            throw error;
        }
    }

    async commitCurrentTransaction(): Promise<void> {
        const context = redisTransactionContext.getStore();

        if (!context) {
            return;
        }

        try {
            await context.multi.exec();
        } catch (error) {
            console.log('Error committing transaction: ', error);
            throw error;
        }
    }

    async executeAfterCommit<T>(operation: () => Promise<T>): Promise<T> {
        const existingContext = redisTransactionContext.getStore();

        if (!existingContext) {
            return operation();
        }

        if (!existingContext.afterCommitCallbacks) {
            existingContext.afterCommitCallbacks = [];
        }

        return new Promise((resolve, reject) => {
            existingContext.afterCommitCallbacks!.push(async () => {
                try {
                    const result = await operation();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    getCurrentTransaction(): RedisTransactionContext | undefined {
        return redisTransactionContext.getStore();
    }
}
