import { TransactionalOptions } from './types';

export function Transactional(options: TransactionalOptions = {}) {
    return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: unknown[]) {
            const { dbTransactionManager } = await import('../config/db');

            if (!dbTransactionManager) {
                console.warn('DbTransactionManager not available, executing without transaction');
                return originalMethod.apply(this, args);
            }

            return dbTransactionManager.executeInTransaction(() => originalMethod.apply(this, args), options);
        };

        return descriptor;
    };
}
