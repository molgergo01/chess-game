import ChatService from '../../src/services/chat.service';
import ChatController from '../../src/controllers/chat.controller';
import { NextFunction, Response } from 'express';
import { GetChatMessagesParams } from '../../src/models/requests';
import { GetChatMessagesResponse } from '../../src/models/responses';
import { ChatMessage } from '../../src/models/chat';
import { AuthenticatedRequest } from 'chess-game-backend-common/types/authenticated.request';
import ForbiddenError from 'chess-game-backend-common/errors/forbidden.error';

jest.mock('../../src/services/chat.service');
jest.mock('../../src/config/container');

describe('Chat Controller', () => {
    let mockChatService: jest.Mocked<ChatService>;
    let chatController: ChatController;

    beforeEach(() => {
        mockChatService = new ChatService(null as never, null as never) as jest.Mocked<ChatService>;
        mockChatService.getChatMessages = jest.fn();

        chatController = new ChatController(mockChatService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    const next: NextFunction = jest.fn();

    describe('Get chat messages', () => {
        it('should get chat messages and return status 200', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                params: {
                    chatId: 'chat1'
                }
            } as Partial<AuthenticatedRequest<GetChatMessagesParams, unknown, unknown>>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const message1: ChatMessage = {
                messageId: 'msg1',
                userId: 'user1',
                message: 'Hello',
                timestamp: new Date('2024-01-01')
            };
            const message2: ChatMessage = {
                messageId: 'msg2',
                userId: 'user2',
                message: 'Hi there',
                timestamp: new Date('2024-01-02')
            };
            const messages = [message1, message2];
            const expectedResponse: GetChatMessagesResponse = {
                messages: messages
            };

            mockChatService.getChatMessages.mockResolvedValue(messages);

            await chatController.getChatMessages(
                req as AuthenticatedRequest<GetChatMessagesParams, unknown, unknown>,
                res as Response,
                next
            );

            expect(mockChatService.getChatMessages).toHaveBeenCalledWith('chat1', 'user1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should get empty chat messages and return status 200', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                params: {
                    chatId: 'chat1'
                }
            } as Partial<AuthenticatedRequest<GetChatMessagesParams, unknown, unknown>>;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as Partial<Response>;

            const messages: ChatMessage[] = [];
            const expectedResponse: GetChatMessagesResponse = {
                messages: messages
            };

            mockChatService.getChatMessages.mockResolvedValue(messages);

            await chatController.getChatMessages(
                req as AuthenticatedRequest<GetChatMessagesParams, unknown, unknown>,
                res as Response,
                next
            );

            expect(mockChatService.getChatMessages).toHaveBeenCalledWith('chat1', 'user1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResponse);
        });

        it('should call next function with ForbiddenError when user is not a member', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                params: {
                    chatId: 'chat1'
                }
            } as Partial<AuthenticatedRequest<GetChatMessagesParams, unknown, unknown>>;
            const res = {} as Partial<Response>;
            const expectedError = new ForbiddenError('User is not a member of the chat');

            mockChatService.getChatMessages.mockRejectedValue(expectedError);

            await chatController.getChatMessages(
                req as AuthenticatedRequest<GetChatMessagesParams, unknown, unknown>,
                res as Response,
                next
            );

            expect(mockChatService.getChatMessages).toHaveBeenCalledWith('chat1', 'user1');
            expect(next).toHaveBeenCalledWith(expectedError);
        });

        it('should call next function with error when error is thrown', async () => {
            const req = {
                user: {
                    id: 'user1',
                    name: 'Player One',
                    email: 'player1@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                params: {
                    chatId: 'chat1'
                }
            } as Partial<AuthenticatedRequest<GetChatMessagesParams, unknown, unknown>>;
            const res = {} as Partial<Response>;
            const expectedError = new Error('error');

            mockChatService.getChatMessages.mockRejectedValue(expectedError);

            await chatController.getChatMessages(
                req as AuthenticatedRequest<GetChatMessagesParams, unknown, unknown>,
                res as Response,
                next
            );

            expect(mockChatService.getChatMessages).toHaveBeenCalledWith('chat1', 'user1');
            expect(next).toHaveBeenCalledWith(expectedError);
        });
    });
});
