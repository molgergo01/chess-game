import request from 'supertest';
import app from '../../src/app';
import Redis from 'chess-game-backend-common/config/redis';
import db from 'chess-game-backend-common/config/db';
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

const addChatParticipant = async (chatId: string, userId: string) => {
    const chatParticipantKey = `chat:${chatId}:participants`;
    await Redis.sAdd(chatParticipantKey, userId);
};

const createChatMessage = async (
    chatId: string,
    messageId: string,
    userId: string,
    message: string,
    timestamp: Date
) => {
    const chatKey = `chat:${chatId}`;
    const messageKey = `message:${messageId}`;

    await Redis.zAdd(chatKey, { value: messageId, score: timestamp.getTime() });
    await Redis.hSet(messageKey, {
        userId: userId,
        message: message,
        timestamp: JSON.stringify(timestamp)
    });
};

describe('Chat routes', () => {
    afterEach(async () => {
        cleanupAuthMocks();

        const keys = await Redis.keys('*');
        if (keys.length > 0) {
            await Redis.del(keys);
        }
        await db.none('TRUNCATE TABLE chess_game.users CASCADE');
    });

    describe('GET /api/chat/:chatId/messages', () => {
        it('should return messages for a participant in chronological order', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

            const chatId = 'test-chat-id';
            await addChatParticipant(chatId, 'user1');
            await addChatParticipant(chatId, 'user2');

            const now = new Date();
            const message1Time = new Date(now.getTime() + 1000);
            const message2Time = new Date(now.getTime() + 2000);
            const message3Time = new Date(now.getTime() + 3000);

            await createChatMessage(chatId, 'msg1', 'user1', 'Hello!', message1Time);
            await createChatMessage(chatId, 'msg2', 'user2', 'Hi there!', message2Time);
            await createChatMessage(chatId, 'msg3', 'user1', 'How are you?', message3Time);

            const res = await authenticatedRequest(request(app).get(`/api/chat/${chatId}/messages`), 'user1');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('messages');
            expect(res.body.messages).toHaveLength(3);

            expect(res.body.messages[0].messageId).toBe('msg1');
            expect(res.body.messages[0].userId).toBe('user1');
            expect(res.body.messages[0].message).toBe('Hello!');

            expect(res.body.messages[1].messageId).toBe('msg2');
            expect(res.body.messages[1].userId).toBe('user2');
            expect(res.body.messages[1].message).toBe('Hi there!');

            expect(res.body.messages[2].messageId).toBe('msg3');
            expect(res.body.messages[2].userId).toBe('user1');
            expect(res.body.messages[2].message).toBe('How are you?');
        });

        it('should return empty array for chat with no messages', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

            const chatId = 'empty-chat-id';
            await addChatParticipant(chatId, 'user1');

            const res = await authenticatedRequest(request(app).get(`/api/chat/${chatId}/messages`), 'user1');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('messages');
            expect(res.body.messages).toEqual([]);
        });

        it('should include system messages in the results', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

            const chatId = 'system-chat-id';
            await addChatParticipant(chatId, 'user1');

            const now = new Date();
            const message1Time = new Date(now.getTime() + 1000);
            const message2Time = new Date(now.getTime() + 2000);
            const message3Time = new Date(now.getTime() + 3000);

            await createChatMessage(chatId, 'msg1', 'SYSTEM', 'Game started', message1Time);
            await createChatMessage(chatId, 'msg2', 'user1', 'Good luck!', message2Time);
            await createChatMessage(chatId, 'msg3', 'SYSTEM', 'Game ended', message3Time);

            const res = await authenticatedRequest(request(app).get(`/api/chat/${chatId}/messages`), 'user1');

            expect(res.status).toBe(200);
            expect(res.body.messages).toHaveLength(3);

            expect(res.body.messages[0].messageId).toBe('msg1');
            expect(res.body.messages[0].userId).toBe('SYSTEM');
            expect(res.body.messages[0].message).toBe('Game started');

            expect(res.body.messages[1].messageId).toBe('msg2');
            expect(res.body.messages[1].userId).toBe('user1');
            expect(res.body.messages[1].message).toBe('Good luck!');

            expect(res.body.messages[2].messageId).toBe('msg3');
            expect(res.body.messages[2].userId).toBe('SYSTEM');
            expect(res.body.messages[2].message).toBe('Game ended');
        });

        it('should return 403 Forbidden when user is not a participant', async () => {
            await createUser('user1', 'User One', 'user1@example.com', 1500, 'avatar_url.com');
            await createUser('user2', 'User Two', 'user2@example.com', 1600, 'avatar_url.com');

            mockAuthServiceVerify({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                elo: 1500,
                avatarUrl: 'avatar_url.com'
            });

            const chatId = 'restricted-chat-id';
            await addChatParticipant(chatId, 'user2');

            const now = new Date();
            await createChatMessage(chatId, 'msg1', 'user2', 'Secret message', now);

            const res = await authenticatedRequest(request(app).get(`/api/chat/${chatId}/messages`), 'user1');

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('not a member of the chat');
        });

        it('should return 403 Forbidden without authentication', async () => {
            const chatId = 'test-chat-id';

            const res = await request(app).get(`/api/chat/${chatId}/messages`);

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Authentication required');
        });
    });
});
