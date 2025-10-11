import knex, { Knex } from 'knex';

let db: Knex | null = null;

function getDb(): Knex {
    if (!db) {
        db = knex({
            client: 'postgresql',
            connection: {
                database: 'chess_game_test',
                user: 'postgres',
                password: 'password'
            }
        });
    }
    return db;
}

export interface CreateUserParams {
    userId: string;
    name: string;
    email: string;
    elo: number;
}

export interface CreateGameParams {
    gameId: string;
    whiteUserId: string;
    blackUserId: string;
    winner: 'w' | 'b' | 'd';
    startedAt: Date;
    endedAt?: Date;
}

export interface CreateMoveParams {
    moveId: string;
    gameId: string;
    moveNumber: number;
    playerColor: 'w' | 'b';
    moveNotation: string;
    positionFen: string;
    whitePlayerTime: number;
    blackPlayerTime: number;
}

export async function createTestUser(params: CreateUserParams): Promise<void> {
    const database = getDb();
    await database('chess_game.users')
        .insert({
            id: params.userId,
            name: params.name,
            email: params.email,
            elo: params.elo
        })
        .onConflict('id')
        .merge();
}

export async function createTestGame(params: CreateGameParams): Promise<void> {
    const database = getDb();
    await database('chess_game.games').insert({
        id: params.gameId,
        white_player_id: params.whiteUserId,
        black_player_id: params.blackUserId,
        winner: params.winner,
        started_at: params.startedAt,
        ended_at: params.endedAt || new Date()
    });
}

export async function createTestMove(params: CreateMoveParams): Promise<void> {
    const database = getDb();
    await database('chess_game.moves').insert({
        id: params.moveId,
        game_id: params.gameId,
        move_number: params.moveNumber,
        player_color: params.playerColor,
        move_notation: params.moveNotation,
        position_fen: params.positionFen,
        white_player_time: params.whitePlayerTime,
        black_player_time: params.blackPlayerTime
    });
}

export async function cleanupTestData(): Promise<void> {
    const database = getDb();
    await database.raw('TRUNCATE TABLE chess_game.moves CASCADE');
    await database.raw('TRUNCATE TABLE chess_game.games CASCADE');
    await database.raw('TRUNCATE TABLE chess_game.users CASCADE');
}

export async function closeDb(): Promise<void> {
    if (db) {
        await db.destroy();
        db = null;
    }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    createTestUser,
    createTestGame,
    createTestMove,
    cleanupTestData,
    closeDb
};
