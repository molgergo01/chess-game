import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`CREATE SCHEMA IF NOT EXISTS chess_game`);
    await knex.raw(
        `CREATE TABLE chess_game.users ( id VARCHAR(255) NOT NULL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), elo INT)`
    );
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`DROP TABLE chess_game.users`);
    await knex.raw(`DROP SCHEMA chess_game`);
}
