import { IDatabase, ITask } from 'pg-promise';
import { getDbTransactionContext } from './context';

export function getDbConnection(db: IDatabase<unknown>): ITask<unknown> | IDatabase<unknown> {
    const context = getDbTransactionContext();
    return context?.trx ?? db;
}
