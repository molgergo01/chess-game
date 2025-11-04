import request from 'supertest';
import app from '../../src/app';
import Redis from 'chess-game-backend-common/config/redis';
import db from 'chess-game-backend-common/config/db';
import { cleanupAuthMocks } from '../fixtures/auth.fixture';
import { Winner } from '../../src/models/game';

jest.mock('chess-game-backend-common/config/env', () => ({
    __esModule: true,
    default: {
        PORTS: {
            CORE: '8080',
            MATCHMAKING: '8081',
            AUTH: '8082'
        },
        URLS: {
            CORE: 'http://localhost:8080',
            MATCHMAKING: 'http://localhost:8081',
            AUTH: 'http://localhost:8082'
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

describe('Internal Game Routes', () => {
    afterEach(async () => {
        cleanupAuthMocks();

        const keys = await Redis.keys('*');
        if (keys.length > 0) {
            await Redis.del(keys);
        }
        await db.none('TRUNCATE TABLE chess_game.moves CASCADE');
        await db.none('TRUNCATE TABLE chess_game.games CASCADE');
        await db.none('TRUNCATE TABLE chess_game.users CASCADE');
    });

    describe('POST /internal/games', () => {
        it('should create a game with valid players, persist to Redis and database', async () => {
            await createUser('player1', 'Player One', 'player1@example.com', 1500, 'avatar_url.com');
            await createUser('player2', 'Player Two', 'player2@example.com', 1600, 'avatar_url.com');

            const players = ['player1', 'player2'];
            const res = await request(app).post('/internal/games').send({ players });

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
            const res = await request(app).post('/internal/games').send({ players });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('playerIds must be exactly 2 players');

            const keys = await Redis.keys('game-id*');
            expect(keys).toHaveLength(0);

            const dbGameResult = await db.query('SELECT * FROM chess_game.games');
            expect(dbGameResult).toHaveLength(0);
        });

        it('should return 400 if players array has more than 2 players', async () => {
            const players = ['player1', 'player2', 'player3'];
            const res = await request(app).post('/internal/games').send({ players });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('playerIds must be exactly 2 players');

            const keys = await Redis.keys('game-id*');
            expect(keys).toHaveLength(0);

            const dbGameResult = await db.query('SELECT * FROM chess_game.games');
            expect(dbGameResult).toHaveLength(0);
        });

        it('should return 400 if players array contains the same player twice', async () => {
            await createUser('player1', 'Player One', 'player1@example.com', 1500, 'avatar_url.com');

            const players = ['player1', 'player1'];
            const res = await request(app).post('/internal/games').send({ players });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('playerIds must be 2 distinct players');

            const keys = await Redis.keys('game-id*');
            expect(keys).toHaveLength(0);

            const dbGameResult = await db.query('SELECT * FROM chess_game.games');
            expect(dbGameResult).toHaveLength(0);
        });

        it('should return 409 if one of the players is already in an active game', async () => {
            await createUser('player1', 'Player One', 'player1@example.com', 1500, 'avatar_url.com');
            await createUser('player2', 'Player Two', 'player2@example.com', 1600, 'avatar_url.com');
            await createUser('player3', 'Player Three', 'player3@example.com', 1550, 'avatar_url.com');

            const gameId = '550e8400-e29b-41d4-a716-446655440000';
            await createGame(gameId, 'player1', 'player2', new Date(), null, null);

            const players = ['player1', 'player3'];
            const res = await request(app).post('/internal/games').send({ players });

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('A player is already in game');

            const player3GameId = await Redis.get('game-id:player3');
            expect(player3GameId).toBeNull();

            const dbGamesResult = await db.query('SELECT * FROM chess_game.games');
            expect(dbGamesResult).toHaveLength(1);
        });
    });

    describe('GET /internal/games/active', () => {
        it('should return active game with position and times for user with active game', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            const players = ['user1', 'user2'];
            const createRes = await request(app).post('/internal/games').send({ players });

            expect(createRes.status).toBe(201);
            const gameId = createRes.body.gameId;

            const res = await request(app).get('/internal/games/active').query({ userId: 'user1' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('gameId');
            expect(res.body.gameId).toBe(gameId);
            expect(res.body).toHaveProperty('whitePlayer');
            expect(res.body).toHaveProperty('blackPlayer');
            expect(res.body).toHaveProperty('position');
            expect(res.body.position).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
            expect(res.body).toHaveProperty('whiteTimeRemaining');
            expect(res.body).toHaveProperty('blackTimeRemaining');
            expect(res.body).toHaveProperty('gameOver');
            expect(res.body.gameOver).toBe(false);
            expect(res.body).toHaveProperty('winner');
            expect(res.body.winner).toBeNull();

            const whitePlayer = res.body.whitePlayer;
            const blackPlayer = res.body.blackPlayer;
            expect([whitePlayer.userId, blackPlayer.userId]).toContain('user1');
            expect([whitePlayer.userId, blackPlayer.userId]).toContain('user2');
        });

        it('should return 404 when user has no active game', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');

            const res = await request(app).get('/internal/games/active').query({ userId: 'user1' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('No active game found for user');
        });
    });
});
