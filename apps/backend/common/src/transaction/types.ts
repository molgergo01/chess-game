import { IDatabase, ITask } from 'pg-promise';
import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;
export type RedisMulti = ReturnType<RedisClient['multi']>;

export interface TransactionContext {
    trx: ITask<unknown> | IDatabase<unknown>;
    readOnly: boolean;
}

export interface RedisTransactionContext {
    multi: RedisMulti;
    afterCommitCallbacks?: Array<() => Promise<void>>;
}

export interface TransactionalOptions {
    readOnly?: boolean;
}
