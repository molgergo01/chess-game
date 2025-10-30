import { Socket } from 'socket.io';
import axios from 'axios';
import SocketAuthMiddleware from '../../src/middlewares/socket.auth.middleware';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Socket Auth Middleware', () => {
    let socketAuthMiddleware: SocketAuthMiddleware;
    let mockSocket: Partial<Socket>;
    let next: (err?: Error) => void;

    beforeEach(() => {
        socketAuthMiddleware = new SocketAuthMiddleware();

        mockSocket = {
            handshake: {
                headers: {}
            } as never,
            data: {}
        };

        next = jest.fn();

        process.env.AUTH_SERVICE_URL = 'http://localhost:8082';
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('authenticate', () => {
        it('should authenticate socket with token from cookie', async () => {
            const token = 'valid-token';
            const user = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                avatarUrl: 'http://example.com/avatar.jpg',
                elo: 1200
            };

            mockSocket.handshake!.headers.cookie = `token=${token}`;
            mockedAxios.post.mockResolvedValue({ data: { user } });

            await socketAuthMiddleware.authenticate(mockSocket as Socket, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            expect(mockSocket.data!.user).toEqual(user);
            expect(next).toHaveBeenCalledWith();
        });

        it('should authenticate socket with token from cookie with multiple cookies', async () => {
            const token = 'valid-token';
            const user = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                avatarUrl: 'http://example.com/avatar.jpg',
                elo: 1200
            };

            mockSocket.handshake!.headers.cookie = `other=value; token=${token}; another=cookie`;
            mockedAxios.post.mockResolvedValue({ data: { user } });

            await socketAuthMiddleware.authenticate(mockSocket as Socket, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            expect(mockSocket.data!.user).toEqual(user);
            expect(next).toHaveBeenCalledWith();
        });

        it('should call next with error when no cookie header present', async () => {
            mockSocket.handshake!.headers.cookie = undefined;

            await socketAuthMiddleware.authenticate(mockSocket as Socket, next);

            expect(mockedAxios.post).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect((next as jest.Mock).mock.calls[0][0].message).toBe('Authentication required');
        });

        it('should call next with error when token cookie is not present', async () => {
            mockSocket.handshake!.headers.cookie = 'other=value; another=cookie';

            await socketAuthMiddleware.authenticate(mockSocket as Socket, next);

            expect(mockedAxios.post).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect((next as jest.Mock).mock.calls[0][0].message).toBe('Authentication required');
        });

        it('should call next with error when cookie header is empty', async () => {
            mockSocket.handshake!.headers.cookie = '';

            await socketAuthMiddleware.authenticate(mockSocket as Socket, next);

            expect(mockedAxios.post).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect((next as jest.Mock).mock.calls[0][0].message).toBe('Authentication required');
        });

        it('should call next with error when axios returns error response', async () => {
            const token = 'invalid-token';
            const error = {
                isAxiosError: true,
                response: {
                    status: 401,
                    data: { message: 'Invalid token' }
                }
            };

            mockSocket.handshake!.headers.cookie = `token=${token}`;
            mockedAxios.post.mockRejectedValue(error);
            mockedAxios.isAxiosError.mockReturnValue(true);

            await socketAuthMiddleware.authenticate(mockSocket as Socket, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect((next as jest.Mock).mock.calls[0][0].message).toBe('Invalid or expired token');
        });

        it('should call next with original error when axios error has no response', async () => {
            const token = 'valid-token';
            const error = new Error('Network error');

            mockSocket.handshake!.headers.cookie = `token=${token}`;
            mockedAxios.post.mockRejectedValue(error);
            mockedAxios.isAxiosError.mockReturnValue(false);

            await socketAuthMiddleware.authenticate(mockSocket as Socket, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            expect(next).toHaveBeenCalledWith(error);
        });

        it('should call next with original error when error is not axios error', async () => {
            const token = 'valid-token';
            const error = new Error('Unexpected error');

            mockSocket.handshake!.headers.cookie = `token=${token}`;
            mockedAxios.post.mockRejectedValue(error);
            mockedAxios.isAxiosError.mockReturnValue(false);

            await socketAuthMiddleware.authenticate(mockSocket as Socket, next);

            expect(next).toHaveBeenCalledWith(error);
        });

        it('should use default auth service URL when env variable is not set', async () => {
            delete process.env.AUTH_SERVICE_URL;

            const token = 'valid-token';
            const user = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                avatarUrl: 'http://example.com/avatar.jpg',
                elo: 1200
            };

            socketAuthMiddleware = new SocketAuthMiddleware();

            mockSocket.handshake!.headers.cookie = `token=${token}`;
            mockedAxios.post.mockResolvedValue({ data: { user } });

            await socketAuthMiddleware.authenticate(mockSocket as Socket, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        });

        it('should parse token correctly when it contains dots and hyphens', async () => {
            const token = 'valid.token-with_special.chars';
            const user = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                avatarUrl: 'http://example.com/avatar.jpg',
                elo: 1200
            };

            mockSocket.handshake!.headers.cookie = `token=${token}`;
            mockedAxios.post.mockResolvedValue({ data: { user } });

            await socketAuthMiddleware.authenticate(mockSocket as Socket, next);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8082/internal/auth/verify',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            expect(mockSocket.data!.user).toEqual(user);
            expect(next).toHaveBeenCalledWith();
        });
    });
});
