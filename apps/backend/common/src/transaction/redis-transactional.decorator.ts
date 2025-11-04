export enum TransactionPropagation {
    REQUIRED = 'REQUIRED',
    REQUIRES_NEW = 'REQUIRES_NEW',
    AFTER_COMMIT = 'AFTER_COMMIT'
}

export interface RedisTransactionalOptions {
    propagation?: TransactionPropagation;
}

export function RedisTransactional(options?: RedisTransactionalOptions) {
    const { propagation = TransactionPropagation.REQUIRED } = options || {};

    return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: unknown[]) {
            const { redisTransactionManager } = await import('../config/redis');

            if (!redisTransactionManager) {
                console.warn('RedisTransactionManager not available, executing without transaction');
                return originalMethod.apply(this, args);
            }

            switch (propagation) {
                case TransactionPropagation.REQUIRES_NEW:
                    await redisTransactionManager.commitCurrentTransaction();
                    return redisTransactionManager.executeInTransaction(() => originalMethod.apply(this, args));

                case TransactionPropagation.AFTER_COMMIT:
                    return redisTransactionManager.executeAfterCommit(() => originalMethod.apply(this, args));

                default:
                    return redisTransactionManager.executeInTransaction(() => originalMethod.apply(this, args));
            }
        };

        return descriptor;
    };
}
