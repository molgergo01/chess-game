import ChatNotificationService from '../../src/services/chat.notification.service';
import { Server } from 'socket.io';
import { Container } from 'inversify';
import { ChatMessage } from '../../src/models/chat';
import { ChatMessagesUpdatedNotification } from '../../src/models/notifications';

jest.mock('socket.io');

describe('Chat Notification Service', () => {
    let mockContainer: jest.Mocked<Container>;
    let mockIo: jest.Mocked<Server>;
    let chatNotificationService: ChatNotificationService;

    beforeEach(() => {
        mockIo = new Server() as jest.Mocked<Server>;
        mockIo.to = jest.fn().mockReturnThis();
        mockIo.emit = jest.fn().mockReturnThis();

        mockContainer = new Container() as jest.Mocked<Container>;
        mockContainer.get = jest.fn().mockReturnValue(mockIo);

        chatNotificationService = new ChatNotificationService(mockContainer);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('Send Chat Messages Updated Notification', () => {
        const chatMessagesUpdatedEvent = 'chat-messages-updated';
        it('should send notification', () => {
            const chatId = '0000';
            const messages: ChatMessage[] = [
                {
                    messageId: '1',
                    userId: 'user1',
                    message: 'Hello',
                    timestamp: new Date('2025-11-02T12:00:00Z')
                },
                {
                    messageId: '2',
                    userId: 'user2',
                    message: 'Hi there',
                    timestamp: new Date('2025-11-02T12:01:00Z')
                }
            ];

            const expectedMessage: ChatMessagesUpdatedNotification = {
                chatMessages: messages
            };

            chatNotificationService.sendChatMessagesUpdatedNotification(chatId, messages);

            expect(mockIo.to).toHaveBeenCalledWith(chatId);
            expect(mockIo.emit).toHaveBeenCalledWith(chatMessagesUpdatedEvent, expectedMessage);
        });
    });
});
