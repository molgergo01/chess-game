import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw('ALTER TABLE chess_game.users ADD COLUMN avatar_url VARCHAR(255)');
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw('ALTER TABLE chess_game.users DROP COLUMN avatar_url');
}
