import { IDatabase } from 'pg-promise';
import { dbTransactionContext } from './context';
import { TransactionContext, TransactionalOptions } from './types';

export class DbTransactionManager {
    constructor(private readonly db: IDatabase<unknown>) {}

    async executeInTransaction<T>(operation: () => Promise<T>, options: TransactionalOptions = {}): Promise<T> {
        const existingContext = dbTransactionContext.getStore();

        if (existingContext) {
            return operation();
        }

        return this.db.tx(async (trx) => {
            const context: TransactionContext = {
                trx,
                readOnly: options.readOnly ?? false
            };

            return dbTransactionContext.run(context, operation);
        });
    }

    getCurrentTransaction(): TransactionContext | undefined {
        return dbTransactionContext.getStore();
    }
}
