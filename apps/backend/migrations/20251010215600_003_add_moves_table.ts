import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'playercolor') THEN
                CREATE TYPE PlayerColor AS ENUM ('w', 'b');
            END IF;
        END
        $$;
  `);
    await knex.raw(
        `CREATE TABLE IF NOT EXISTS chess_game.moves (
            id uuid NOT NULL PRIMARY KEY,
            game_id uuid NOT NULL REFERENCES chess_game.games ON DELETE CASCADE,
            move_number INT NOT NULL,
            player_color PlayerColor NOT NULL,
            move_notation TEXT NOT NULL,
            position_fen TEXT NOT NULL,
            white_player_time INT NOT NULL,
            black_player_time INT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
         )`
    );
    await knex.raw(`CREATE INDEX idx_moves_game_id on chess_game.moves (game_id)`);
    await knex.raw(`CREATE INDEX idx_moves_move_number on chess_game.moves (move_number)`);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`DROP TABLE IF EXISTS chess_game.moves`);
}
