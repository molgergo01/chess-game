export function RedisTransactional() {
    return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: unknown[]) {
            const { redisTransactionManager } = await import('../config/redis');

            if (!redisTransactionManager) {
                console.warn('RedisTransactionManager not available, executing without transaction');
                return originalMethod.apply(this, args);
            }

            return redisTransactionManager.executeInTransaction(() => originalMethod.apply(this, args));
        };

        return descriptor;
    };
}
