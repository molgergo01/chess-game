import request from 'supertest';
import app from '../../src/app';
import Redis from 'chess-game-backend-common/config/redis';
import db from 'chess-game-backend-common/config/db';
import { Winner } from '../../src/models/game';

jest.mock('chess-game-backend-common/config/env', () => ({
    __esModule: true,
    default: {
        PORTS: {
            CORE: '8080',
            MATCHMAKING: '8081',
            AUTH: '8082'
        },
        JWT_SECRET: 'test_jwt_secret',
        GOOGLE_CLIENT_ID: 'test_google_client_id',
        GOOGLE_CLIENT_SECRET: 'test_google_client_secret',
        NODE_ENV: 'test',
        DB_USER: 'postgres',
        DB_PASSWORD: 'password',
        DB_TEST_DATABASE: 'chess_game_test',
        REDIS_URL: 'redis://localhost:6379',
        REDIS_TEST_DB: 1
    }
}));

const createUser = async (id: string, name: string, email: string, elo: number, avatarUrl: string) => {
    const sql = 'INSERT INTO chess_game.users (id, name, email, avatar_url, elo) VALUES ($1, $2, $3, $4, $5)';
    await db.none(sql, [id, name, email, avatarUrl, elo]);
};

const createGame = async (
    id: string,
    whitePlayerId: string,
    blackPlayerId: string,
    startedAt: Date,
    endedAt: Date | null,
    winner: Winner | null
) => {
    const sql =
        'INSERT INTO chess_game.games (id, white_player_id, black_player_id, started_at, ended_at, winner) VALUES ($1, $2, $3, $4, $5, $6)';
    await db.none(sql, [id, whitePlayerId, blackPlayerId, startedAt, endedAt, winner]);
};

const createMove = async (
    id: string,
    gameId: string,
    moveNumber: number,
    playerColor: string,
    moveNotation: string,
    positionFen: string,
    whitePlayerTime: number,
    blackPlayerTime: number,
    createdAt: Date
) => {
    const sql =
        'INSERT INTO chess_game.moves (id, game_id, move_number, player_color, move_notation, position_fen, white_player_time, black_player_time, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
    await db.none(sql, [
        id,
        gameId,
        moveNumber,
        playerColor,
        moveNotation,
        positionFen,
        whitePlayerTime,
        blackPlayerTime,
        createdAt
    ]);
};

describe('Game routes', () => {
    afterEach(async () => {
        const keys = await Redis.keys('*');
        if (keys.length > 0) {
            await Redis.del(keys);
        }
        await db.none('TRUNCATE TABLE chess_game.moves CASCADE');
        await db.none('TRUNCATE TABLE chess_game.games CASCADE');
        await db.none('TRUNCATE TABLE chess_game.users CASCADE');
    });

    afterAll(async () => {
        await Redis.quit();
        await db.$pool.end();
    });

    describe('POST /api/games', () => {
        it('should create a game with valid players, persist to Redis and database', async () => {
            await createUser('player1', 'Player One', 'player1@example.com', 1500, 'avatar_url.com');
            await createUser('player2', 'Player Two', 'player2@example.com', 1600, 'avatar_url.com');

            const players = ['player1', 'player2'];
            const res = await request(app).post('/api/games').send({ players });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('gameId');
            expect(res.body).toHaveProperty('players');
            expect(res.body.players).toHaveLength(2);

            const gameId = res.body.gameId;

            const gameState = await Redis.hGetAll(`game-state:${gameId}`);
            expect(gameState).toBeDefined();
            expect(gameState.position).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
            expect(gameState.players).toBeDefined();
            const storedPlayers = JSON.parse(gameState.players);
            expect(storedPlayers).toHaveLength(2);
            expect(gameState.lastMoveEpoch).toBe('0');
            expect(gameState.startedAt).toBeDefined();

            const player1GameId = await Redis.get('game-id:player1');
            const player2GameId = await Redis.get('game-id:player2');
            expect(player1GameId).toBe(gameId);
            expect(player2GameId).toBe(gameId);

            const dbGameResult = await db.query('SELECT * FROM chess_game.games WHERE id = $1', [gameId]);
            expect(dbGameResult).toHaveLength(1);
            const dbGame = dbGameResult[0];
            expect(dbGame.id).toBe(gameId);
            expect([dbGame.white_player_id, dbGame.black_player_id]).toContain('player1');
            expect([dbGame.white_player_id, dbGame.black_player_id]).toContain('player2');
            expect(dbGame.started_at).toBeDefined();
            expect(dbGame.ended_at).toBeNull();
            expect(dbGame.winner).toBeNull();
        });

        it('should return 400 if players array has only 1 player', async () => {
            const players = ['player1'];
            const res = await request(app).post('/api/games').send({ players });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Chess game requires exactly 2 players');

            const keys = await Redis.keys('game-id*');
            expect(keys).toHaveLength(0);

            const dbGameResult = await db.query('SELECT * FROM chess_game.games');
            expect(dbGameResult).toHaveLength(0);
        });

        it('should return 400 if players array has more than 2 players', async () => {
            const players = ['player1', 'player2', 'player3'];
            const res = await request(app).post('/api/games').send({ players });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Chess game requires exactly 2 players');

            const keys = await Redis.keys('game-id*');
            expect(keys).toHaveLength(0);

            const dbGameResult = await db.query('SELECT * FROM chess_game.games');
            expect(dbGameResult).toHaveLength(0);
        });
    });

    describe('GET /api/games', () => {
        it('should return game history for a user with games', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');
            await createUser('user3', 'User Three', 'user3@example.com', 1550, 'avatar_url.com');

            const now = new Date();
            const game1Id = '550e8400-e29b-41d4-a716-446655440001';
            const game2Id = '550e8400-e29b-41d4-a716-446655440002';
            const game1EndedAt = new Date(now.getTime() + 1000);
            const game2EndedAt = new Date(now.getTime() + 2000);

            await createGame(game1Id, 'user1', 'user2', now, game1EndedAt, Winner.WHITE);
            await createGame(game2Id, 'user3', 'user1', now, game2EndedAt, Winner.BLACK);

            const res = await request(app).get('/api/games').query({ userId: 'user1' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('games');
            expect(res.body).toHaveProperty('totalCount');
            expect(res.body.games).toHaveLength(2);
            expect(Number(res.body.totalCount)).toBe(2);

            expect(res.body.games[0].gameId).toBe(game2Id);
            expect(res.body.games[1].gameId).toBe(game1Id);

            expect(res.body.games[0].whitePlayer.userId).toBe('user3');
            expect(res.body.games[0].blackPlayer.userId).toBe('user1');
            expect(res.body.games[0].winner).toBe(Winner.BLACK);

            expect(res.body.games[1].whitePlayer.userId).toBe('user1');
            expect(res.body.games[1].blackPlayer.userId).toBe('user2');
            expect(res.body.games[1].winner).toBe(Winner.WHITE);
        });

        it('should return empty array for user with no games', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');

            const res = await request(app).get('/api/games').query({ userId: 'user1' });

            expect(res.status).toBe(200);
            expect(res.body.games).toEqual([]);
            expect(Number(res.body.totalCount)).toBe(0);
        });

        it('should apply limit parameter correctly', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            const now = new Date();
            const game1Id = '550e8400-e29b-41d4-a716-446655440001';
            const game2Id = '550e8400-e29b-41d4-a716-446655440002';
            const game3Id = '550e8400-e29b-41d4-a716-446655440003';
            await createGame(
                game1Id,
                'user1',
                'user2',
                new Date(now.getTime() + 1000),
                new Date(now.getTime() + 5000),
                Winner.WHITE
            );
            await createGame(
                game2Id,
                'user1',
                'user2',
                new Date(now.getTime() + 2000),
                new Date(now.getTime() + 6000),
                Winner.BLACK
            );
            await createGame(
                game3Id,
                'user1',
                'user2',
                new Date(now.getTime() + 3000),
                new Date(now.getTime() + 7000),
                Winner.DRAW
            );

            const res = await request(app).get('/api/games').query({ userId: 'user1', limit: '2' });

            expect(res.status).toBe(200);
            expect(res.body.games).toHaveLength(2);
            expect(Number(res.body.totalCount)).toBe(3);
        });

        it('should apply offset parameter correctly', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            const now = new Date();
            const game1Id = '550e8400-e29b-41d4-a716-446655440001';
            const game2Id = '550e8400-e29b-41d4-a716-446655440002';
            const game3Id = '550e8400-e29b-41d4-a716-446655440003';
            await createGame(
                game1Id,
                'user1',
                'user2',
                new Date(now.getTime() + 1000),
                new Date(now.getTime() + 5000),
                Winner.WHITE
            );
            await createGame(
                game2Id,
                'user1',
                'user2',
                new Date(now.getTime() + 2000),
                new Date(now.getTime() + 6000),
                Winner.BLACK
            );
            await createGame(
                game3Id,
                'user1',
                'user2',
                new Date(now.getTime() + 3000),
                new Date(now.getTime() + 7000),
                Winner.DRAW
            );

            const res = await request(app).get('/api/games').query({ userId: 'user1', offset: '1' });

            expect(res.status).toBe(200);
            expect(res.body.games).toHaveLength(2);
            expect(res.body.games[0].gameId).toBe(game2Id);
            expect(res.body.games[1].gameId).toBe(game1Id);
            expect(Number(res.body.totalCount)).toBe(3);
        });

        it('should apply both limit and offset correctly', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            const now = new Date();
            const game1Id = '550e8400-e29b-41d4-a716-446655440001';
            const game2Id = '550e8400-e29b-41d4-a716-446655440002';
            const game3Id = '550e8400-e29b-41d4-a716-446655440003';
            await createGame(
                game1Id,
                'user1',
                'user2',
                new Date(now.getTime() + 1000),
                new Date(now.getTime() + 5000),
                Winner.WHITE
            );
            await createGame(
                game2Id,
                'user1',
                'user2',
                new Date(now.getTime() + 2000),
                new Date(now.getTime() + 6000),
                Winner.BLACK
            );
            await createGame(
                game3Id,
                'user1',
                'user2',
                new Date(now.getTime() + 3000),
                new Date(now.getTime() + 7000),
                Winner.DRAW
            );

            const res = await request(app).get('/api/games').query({ userId: 'user1', limit: '1', offset: '1' });

            expect(res.status).toBe(200);
            expect(res.body.games).toHaveLength(1);
            expect(res.body.games[0].gameId).toBe(game2Id);
            expect(Number(res.body.totalCount)).toBe(3);
        });

        it('should return 400 if userId query parameter is missing', async () => {
            const res = await request(app).get('/api/games');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('userId query parameter is required');
        });
    });

    describe('GET /api/games/:gameId', () => {
        it('should return game with moves for completed game', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            const gameId = '550e8400-e29b-41d4-a716-446655440000';
            const now = new Date();
            const endedAt = new Date(now.getTime() + 10000);

            await createGame(gameId, 'user1', 'user2', now, endedAt, Winner.WHITE);
            await createMove(
                '550e8400-e29b-41d4-a716-446655440001',
                gameId,
                1,
                'w',
                'e4',
                'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                600000,
                600000,
                new Date(now.getTime() + 1000)
            );
            await createMove(
                '550e8400-e29b-41d4-a716-446655440002',
                gameId,
                1,
                'b',
                'e5',
                'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
                600000,
                599000,
                new Date(now.getTime() + 2000)
            );

            const res = await request(app).get(`/api/games/${gameId}`);

            expect(res.status).toBe(200);
            expect(res.body.gameId).toBe(gameId);
            expect(res.body.whitePlayer.userId).toBe('user1');
            expect(res.body.blackPlayer.userId).toBe('user2');
            expect(res.body.winner).toBe(Winner.WHITE);
            expect(res.body.moves).toHaveLength(2);
            expect(res.body.moves[0].moveNotation).toBe('e4');
            expect(res.body.moves[0].playerColor).toBe('w');
            expect(res.body.moves[1].moveNotation).toBe('e5');
            expect(res.body.moves[1].playerColor).toBe('b');
        });

        it('should return 500 for game still in progress', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            const gameId = '550e8400-e29b-41d4-a716-446655440000';
            const now = new Date();

            await createGame(gameId, 'user1', 'user2', now, null, null);

            const res = await request(app).get(`/api/games/${gameId}`);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain(
                'Game with id 550e8400-e29b-41d4-a716-446655440000 is still in progress'
            );
        });

        it('should return 404 for non-existent game', async () => {
            const gameId = '550e8400-e29b-41d4-a716-446655440000';

            const res = await request(app).get(`/api/games/${gameId}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not found');
        });

        it('should return 400 for invalid game ID format', async () => {
            const invalidGameId = 'invalid-uuid';

            const res = await request(app).get(`/api/games/${invalidGameId}`);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Invalid game');
        });
    });
});
