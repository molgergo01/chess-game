import { Knex } from 'knex';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex: Knex) {
    await knex.raw(`CREATE SCHEMA IF NOT EXISTS chess_game`);
    await knex.raw(
        `CREATE TABLE chess_game.users ( id VARCHAR(255) NOT NULL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), elo INT)`
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex: Knex) {
    await knex.raw(`DROP TABLE chess_game.users`);
    await knex.raw(`DROP SCHEMA chess_game`);
};
