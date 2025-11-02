import { ChatMessage } from '../../src/models/chat';
import { NextFunction, Request, Response } from 'express';
import { createServer, Server as NodeServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { Server, type Socket as ServerSocket } from 'socket.io';

const mocks = {
    chatService: {
        addParticipant: jest.fn(),
        removeParticipant: jest.fn(),
        createChatMessage: jest.fn(),
        getChatMessages: jest.fn(),
        createSystemChatMessage: jest.fn()
    },
    chatNotificationService: {
        sendChatMessagesUpdatedNotification: jest.fn()
    }
};

jest.mock('chess-game-backend-common/config/passport', () => ({
    initialize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next())
}));

jest.mock('../../src/services/chat.service');
jest.mock('../../src/services/chat.notification.service');
jest.mock('../../src/config/container', () => ({
    get: jest.fn((service) => {
        if (service.name === 'ChatService') return mocks.chatService;
        if (service.name === 'ChatNotificationService') return mocks.chatNotificationService;
        return null;
    }),
    bind: jest.fn().mockReturnThis(),
    toConstantValue: jest.fn()
}));

import chatListener from '../../src/listeners/chat.listener';

describe('Chat Listener', () => {
    let io: Server, clientSocket: ClientSocket;
    let httpServer: NodeServer;
    const userId = 'user123';
    const chatId = 'chat456';

    beforeAll((done) => {
        httpServer = createServer();
        io = new Server(httpServer);
        httpServer.listen(() => {
            const port = (httpServer.address() as AddressInfo).port;
            clientSocket = ioc(`http://localhost:${port}`);
            io.on('connection', (socket: ServerSocket) => {
                socket.data.user = { id: userId };
                const { joinChat, leaveChat, sendChatMessage } = chatListener(io, socket);

                socket.on('joinChat', joinChat);
                socket.on('leaveChat', leaveChat);
                socket.on('sendChatMessage', sendChatMessage);
            });
            clientSocket.on('connect', done);
        });
    });

    afterAll(async () => {
        clientSocket.disconnect();
        io.disconnectSockets();
        await io.close();
        httpServer.closeAllConnections();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('joinChat', () => {
        it('should join the chat room and add participant', async () => {
            mocks.chatService.addParticipant.mockResolvedValue(undefined);

            clientSocket.emit('joinChat', { chatId });

            await new Promise((resolve) => setTimeout(resolve, 100));

            const serverSocket = Array.from(io.sockets.sockets.values())[0];
            expect(serverSocket.rooms.has(chatId)).toBe(true);
            expect(mocks.chatService.addParticipant).toHaveBeenCalledWith(chatId, userId);
        });
    });

    describe('leaveChat', () => {
        it('should remove participant and leave the chat room', async () => {
            mocks.chatService.removeParticipant.mockResolvedValue(undefined);

            clientSocket.emit('joinChat', { chatId });

            await new Promise((resolve) => setTimeout(resolve, 100));

            const serverSocket = Array.from(io.sockets.sockets.values())[0];
            expect(serverSocket.rooms.has(chatId)).toBe(true);

            clientSocket.emit('leaveChat', { chatId });

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mocks.chatService.removeParticipant).toHaveBeenCalledWith(chatId, userId);
            expect(serverSocket.rooms.has(chatId)).toBe(false);
        });
    });

    describe('sendChatMessage', () => {
        it('should create message, fetch messages, and send notification', async () => {
            const message = 'Hello, let us play chess!';
            const chatMessages: ChatMessage[] = [{ messageId: '1', userId, message, timestamp: new Date() }];

            mocks.chatService.createChatMessage.mockResolvedValue(undefined);
            mocks.chatService.getChatMessages.mockResolvedValue(chatMessages);

            clientSocket.emit('sendChatMessage', { chatId, message });

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mocks.chatService.createChatMessage).toHaveBeenCalledWith(chatId, userId, message);
            expect(mocks.chatService.getChatMessages).toHaveBeenCalledWith(chatId, userId);
            expect(mocks.chatNotificationService.sendChatMessagesUpdatedNotification).toHaveBeenCalledWith(
                chatId,
                chatMessages
            );
        });
    });
});
