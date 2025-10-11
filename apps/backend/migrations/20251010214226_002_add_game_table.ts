import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'winner') THEN
                CREATE TYPE Winner AS ENUM ('w', 'b', 'd');
            END IF;
        END
        $$;
    `);
    await knex.raw(
        `CREATE TABLE IF NOT EXISTS chess_game.games (
            id uuid NOT NULL PRIMARY KEY,
            white_player_id VARCHAR(255) NOT NULL REFERENCES chess_game.users,
            black_player_id VARCHAR(255) NOT NULL REFERENCES chess_game.users,
            started_at TIMESTAMP NOT NULL DEFAULT NOW(),
            ended_at TIMESTAMP,
            winner Winner
        )`
    );
    await knex.raw(`CREATE INDEX idx_games_white_player ON chess_game.games (white_player_id)`);
    await knex.raw(`CREATE INDEX idx_games_black_player ON chess_game.games (black_player_id)`);
    await knex.raw(`CREATE INDEX idx_games_started_at ON chess_game.games (started_at)`);
    await knex.raw(`CREATE INDEX idx_games_winner ON chess_game.games (winner)`);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`DROP TABLE IF EXISTS chess_game.games`);
}
