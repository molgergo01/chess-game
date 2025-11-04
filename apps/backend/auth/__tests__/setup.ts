jest.mock('chess-game-backend-common/transaction/redis-transactional.decorator', () => ({
    RedisTransactional: () => {
        return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    },
    TransactionPropagation: {
        REQUIRED: 'REQUIRED',
        REQUIRES_NEW: 'REQUIRES_NEW',
        AFTER_COMMIT: 'AFTER_COMMIT'
    }
}));

jest.mock('chess-game-backend-common/transaction/transactional.decorator', () => ({
    Transactional: () => {
        return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    }
}));
