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

import { JoinChatRoomCallback } from '../../src/models/callbacks';
import { ChatMessage } from '../../src/models/chat';
import { NextFunction, Request, Response } from 'express';
import { createServer, Server as NodeServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { Server, type Socket as ServerSocket } from 'socket.io';
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
        clientSocket.removeAllListeners('chat-error');
    });

    describe('joinChat', () => {
        it('should join the chat room and add participant', async () => {
            mocks.chatService.addParticipant.mockResolvedValue(undefined);

            const result: JoinChatRoomCallback = await clientSocket.emitWithAck('joinChat', { chatId });

            expect(result).toEqual({ success: true });

            const serverSocket = Array.from(io.sockets.sockets.values())[0];
            expect(serverSocket.rooms.has(chatId)).toBe(true);
            expect(mocks.chatService.addParticipant).toHaveBeenCalledWith(chatId, userId);
        });

        it('should emit chat-error event when joinChat fails', async () => {
            mocks.chatService.addParticipant.mockRejectedValue(new Error('Failed to add participant'));

            const errorPromise = new Promise<void>((resolve) => {
                clientSocket.on('chat-error', (error) => {
                    expect(error).toEqual({
                        message: 'An unexpected error occurred',
                        code: undefined
                    });
                    resolve();
                });
            });

            const result: JoinChatRoomCallback = await clientSocket.emitWithAck('joinChat', { chatId });

            expect(result).toEqual({ success: false });
            await errorPromise;
        });
    });

    describe('leaveChat', () => {
        it('should remove participant and leave the chat room', async () => {
            mocks.chatService.removeParticipant.mockResolvedValue(undefined);

            await clientSocket.emitWithAck('joinChat', { chatId });

            const serverSocket = Array.from(io.sockets.sockets.values())[0];
            expect(serverSocket.rooms.has(chatId)).toBe(true);

            clientSocket.emit('leaveChat', { chatId });

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mocks.chatService.removeParticipant).toHaveBeenCalledWith(chatId, userId);
            expect(serverSocket.rooms.has(chatId)).toBe(false);
        });

        it('should emit chat-error event when leaveChat fails', async () => {
            mocks.chatService.addParticipant.mockResolvedValue(undefined);
            await clientSocket.emitWithAck('joinChat', { chatId });

            mocks.chatService.removeParticipant.mockRejectedValue(new Error('Failed to remove participant'));

            const errorPromise = new Promise<void>((resolve) => {
                clientSocket.once('chat-error', (error) => {
                    expect(error).toEqual({
                        message: 'An unexpected error occurred',
                        code: undefined
                    });
                    resolve();
                });
            });

            clientSocket.emit('leaveChat', { chatId });

            await Promise.race([
                errorPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for chat-error')), 1000))
            ]);
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

        it('should emit chat-error event when sendChatMessage fails', async () => {
            const message = 'Hello, let us play chess!';
            mocks.chatService.addParticipant.mockResolvedValue(undefined);
            await clientSocket.emitWithAck('joinChat', { chatId });

            mocks.chatService.createChatMessage.mockRejectedValue(new Error('Failed to create message'));

            const errorPromise = new Promise<void>((resolve) => {
                clientSocket.once('chat-error', (error) => {
                    expect(error).toEqual({
                        message: 'An unexpected error occurred',
                        code: undefined
                    });
                    expect(mocks.chatNotificationService.sendChatMessagesUpdatedNotification).not.toHaveBeenCalled();
                    resolve();
                });
            });

            clientSocket.emit('sendChatMessage', { chatId, message });

            await Promise.race([
                errorPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for chat-error')), 1000))
            ]);
        });
    });
});
