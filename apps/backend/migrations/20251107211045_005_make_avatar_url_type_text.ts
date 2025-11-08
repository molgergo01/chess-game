import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    knex.raw(`
        ALTER TABLE chess_game.users
        ALTER COLUMN avatar_url TYPE TEXT;
    `);
}

export async function down(knex: Knex): Promise<void> {
    knex.raw(`
        ALTER TABLE chess_game.users
        ALTER COLUMN avatar_url TYPE VARCHAR(255);
    `);
}
