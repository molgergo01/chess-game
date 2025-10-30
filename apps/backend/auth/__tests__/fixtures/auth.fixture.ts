import jwt, { JwtPayload } from 'jsonwebtoken';
import { Test } from 'supertest';
import db from 'chess-game-backend-common/config/db';
import env from 'chess-game-backend-common/config/env';

export interface TestUser {
    id: string;
    name: string;
    email: string;
    elo: number;
    avatarUrl: string;
}

export const createTestUser = async (
    id: string,
    name: string,
    email: string,
    elo: number = 1500,
    avatarUrl: string = 'https://example.com/avatar.jpg'
): Promise<TestUser> => {
    const sql = 'INSERT INTO chess_game.users (id, name, email, avatar_url, elo) VALUES ($1, $2, $3, $4, $5)';
    await db.none(sql, [id, name, email, avatarUrl, elo]);
    return { id, name, email, elo, avatarUrl };
};

export const generateTestToken = (userId: string): string => {
    const now = Math.floor(Date.now() / 1000);
    const payload: JwtPayload = {
        sub: userId,
        iat: now,
        exp: now + 7 * 24 * 60 * 60
    };
    return jwt.sign(payload, env.JWT_SECRET!);
};

export const authenticatedRequest = (request: Test, userId?: string, token?: string): Test => {
    const authToken = token || (userId ? generateTestToken(userId) : generateTestToken('default-user-id'));
    return request.set('Authorization', `Bearer ${authToken}`);
};
