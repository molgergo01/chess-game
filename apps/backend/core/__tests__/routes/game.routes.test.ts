import request from 'supertest';
import app from '../../src/app';
import Redis from 'chess-game-backend-common/config/redis';
import db from 'chess-game-backend-common/config/db';
import { Winner } from '../../src/models/game';
import { authenticatedRequest, cleanupAuthMocks, mockAuthServiceVerify } from '../fixtures/auth.fixture';

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
        cleanupAuthMocks();

        const keys = await Redis.keys('*');
        if (keys.length > 0) {
            await Redis.del(keys);
        }
        await db.none('TRUNCATE TABLE chess_game.moves CASCADE');
        await db.none('TRUNCATE TABLE chess_game.games CASCADE');
        await db.none('TRUNCATE TABLE chess_game.users CASCADE');
    });

    describe('GET /api/games', () => {
        it('should return game history for a user with games', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');
            await createUser('user3', 'User Three', 'user3@example.com', 1550, 'avatar_url.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

            const now = new Date();
            const game1Id = '550e8400-e29b-41d4-a716-446655440001';
            const game2Id = '550e8400-e29b-41d4-a716-446655440002';
            const game1EndedAt = new Date(now.getTime() + 1000);
            const game2EndedAt = new Date(now.getTime() + 2000);

            await createGame(game1Id, 'user1', 'user2', now, game1EndedAt, Winner.WHITE);
            await createGame(game2Id, 'user3', 'user1', now, game2EndedAt, Winner.BLACK);

            const res = await authenticatedRequest(request(app).get('/api/games'), 'user1');

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

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

            const res = await authenticatedRequest(request(app).get('/api/games'), 'user1');

            expect(res.status).toBe(200);
            expect(res.body.games).toEqual([]);
            expect(Number(res.body.totalCount)).toBe(0);
        });

        it('should apply limit parameter correctly', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

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

            const res = await authenticatedRequest(request(app).get('/api/games'), 'user1').query({ limit: 2 });

            expect(res.status).toBe(200);
            expect(res.body.games).toHaveLength(2);
            expect(Number(res.body.totalCount)).toBe(3);
        });

        it('should apply offset parameter correctly', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

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

            const res = await authenticatedRequest(request(app).get('/api/games'), 'user1').query({ offset: 1 });

            expect(res.status).toBe(200);
            expect(res.body.games).toHaveLength(2);
            expect(res.body.games[0].gameId).toBe(game2Id);
            expect(res.body.games[1].gameId).toBe(game1Id);
            expect(Number(res.body.totalCount)).toBe(3);
        });

        it('should apply both limit and offset correctly', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

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

            const res = await authenticatedRequest(request(app).get('/api/games'), 'user1').query({
                offset: 1,
                limit: 1
            });

            expect(res.status).toBe(200);
            expect(res.body.games).toHaveLength(1);
            expect(res.body.games[0].gameId).toBe(game2Id);
            expect(Number(res.body.totalCount)).toBe(3);
        });
    });

    describe('GET /api/games/active', () => {
        it('should return active game with position and times for user with active game', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

            const players = ['user1', 'user2'];
            const createRes = await request(app).post('/internal/games').send({ players });

            expect(createRes.status).toBe(201);
            const gameId = createRes.body.gameId;

            const res = await authenticatedRequest(request(app).get('/api/games/active'), 'user1');

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

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

            const res = await authenticatedRequest(request(app).get('/api/games/active'), 'user1');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('No active game found for user');
        });
    });

    describe('GET /api/games/:gameId', () => {
        it('should return game with moves for completed game', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

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

            const res = await authenticatedRequest(request(app).get(`/api/games/${gameId}`), 'user1');

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

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

            const gameId = '550e8400-e29b-41d4-a716-446655440000';
            const now = new Date();

            await createGame(gameId, 'user1', 'user2', now, null, null);

            const res = await authenticatedRequest(request(app).get(`/api/games/${gameId}`), 'user1');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain(
                'Game with id 550e8400-e29b-41d4-a716-446655440000 is still in progress'
            );
        });

        it('should return 404 for non-existent game', async () => {
            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

            const gameId = '550e8400-e29b-41d4-a716-446655440000';

            const res = await authenticatedRequest(request(app).get(`/api/games/${gameId}`), 'user1');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not found');
        });

        it('should return 400 for invalid game ID format', async () => {
            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

            const invalidGameId = 'invalid-uuid';

            const res = await authenticatedRequest(request(app).get(`/api/games/${invalidGameId}`), 'user1');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Invalid game');
        });
    });
});
