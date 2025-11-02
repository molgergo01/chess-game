import ChatService from '../../src/services/chat.service';
import ChatRepository from '../../src/repositories/chat.repository';
import MessageRepository from '../../src/repositories/message.repository';
import { v4 as uuidv4 } from 'uuid';
import ForbiddenError from 'chess-game-backend-common/errors/forbidden.error';
import { ChatMessage } from '../../src/models/chat';

jest.mock('uuid', () => ({
    v4: jest.fn()
}));

jest.mock('../../src/repositories/chat.repository');
jest.mock('../../src/repositories/message.repository');

describe('Chat Service', () => {
    const NOW = 10000000;

    let mockChatRepository: jest.Mocked<ChatRepository>;
    let mockMessageRepository: jest.Mocked<MessageRepository>;
    let chatService: ChatService;

    let mockUuid = jest.fn();

    beforeEach(() => {
        mockUuid = jest.mocked(uuidv4);

        jest.useFakeTimers();
        jest.setSystemTime(NOW);

        mockChatRepository = new ChatRepository() as jest.Mocked<ChatRepository>;
        mockChatRepository.addParticipant = jest.fn();
        mockChatRepository.removeParticipant = jest.fn();
        mockChatRepository.isParticipant = jest.fn();
        mockChatRepository.addChatMessageId = jest.fn();
        mockChatRepository.getChatMessageIds = jest.fn();
        mockChatRepository.removeChat = jest.fn();

        mockMessageRepository = new MessageRepository() as jest.Mocked<MessageRepository>;
        mockMessageRepository.saveMessage = jest.fn();
        mockMessageRepository.getMessageBatch = jest.fn();
        mockMessageRepository.removeMessages = jest.fn();

        chatService = new ChatService(mockChatRepository, mockMessageRepository);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('Add Participant', () => {
        it('should add participant to chat', async () => {
            const chatId = 'chat-123';
            const userId = 'user-456';

            await chatService.addParticipant(chatId, userId);

            expect(mockChatRepository.addParticipant).toHaveBeenCalledWith(chatId, userId);
        });
    });

    describe('Remove Participant', () => {
        it('should remove participant from chat', async () => {
            const chatId = 'chat-123';
            const userId = 'user-456';

            await chatService.removeParticipant(chatId, userId);

            expect(mockChatRepository.removeParticipant).toHaveBeenCalledWith(chatId, userId);
        });
    });

    describe('Delete Chat', () => {
        it('should retrieve message IDs, remove messages, then remove chat', async () => {
            const chatId = 'chat-123';
            const messageIds = ['msg-1', 'msg-2', 'msg-3'];

            mockChatRepository.getChatMessageIds.mockResolvedValue(messageIds);

            await chatService.deleteChat(chatId);

            expect(mockChatRepository.getChatMessageIds).toHaveBeenCalledWith(chatId);
            expect(mockMessageRepository.removeMessages).toHaveBeenCalledWith(messageIds);
            expect(mockChatRepository.removeChat).toHaveBeenCalledWith(chatId);
        });

        it('should handle empty chat with no messages', async () => {
            const chatId = 'chat-123';
            const messageIds: string[] = [];

            mockChatRepository.getChatMessageIds.mockResolvedValue(messageIds);

            await chatService.deleteChat(chatId);

            expect(mockChatRepository.getChatMessageIds).toHaveBeenCalledWith(chatId);
            expect(mockMessageRepository.removeMessages).toHaveBeenCalledWith([]);
            expect(mockChatRepository.removeChat).toHaveBeenCalledWith(chatId);
        });
    });

    describe('Create Chat Message', () => {
        it('should verify participant, create message with correct UUID and timestamp, and save to both repositories', async () => {
            const chatId = 'chat-123';
            const userId = 'user-456';
            const message = 'Hello, world!';
            const messageId = 'msg-uuid-789';

            mockChatRepository.isParticipant.mockResolvedValue(true);
            mockUuid.mockReturnValue(messageId);

            await chatService.createChatMessage(chatId, userId, message);

            expect(mockChatRepository.isParticipant).toHaveBeenCalledWith(chatId, userId);
            expect(mockChatRepository.addChatMessageId).toHaveBeenCalledWith(chatId, messageId, new Date(NOW));
            expect(mockMessageRepository.saveMessage).toHaveBeenCalledWith(messageId, message, userId, new Date(NOW));
        });

        it('should throw ForbiddenError when user is not a participant', async () => {
            const chatId = 'chat-123';
            const userId = 'user-456';
            const message = 'Hello, world!';

            mockChatRepository.isParticipant.mockResolvedValue(false);

            await expect(chatService.createChatMessage(chatId, userId, message)).rejects.toThrow(ForbiddenError);
            await expect(chatService.createChatMessage(chatId, userId, message)).rejects.toThrow(
                'User is not a member of the chat'
            );
        });
    });

    describe('Create System Chat Message', () => {
        it('should create system message with SYSTEM as userId, correct UUID and timestamp', async () => {
            const chatId = 'chat-123';
            const message = 'Game started';
            const messageId = 'msg-system-123';

            mockUuid.mockReturnValue(messageId);

            await chatService.createSystemChatMessage(chatId, message);

            expect(mockChatRepository.addChatMessageId).toHaveBeenCalledWith(chatId, messageId, new Date(NOW));
            expect(mockMessageRepository.saveMessage).toHaveBeenCalledWith(messageId, message, 'SYSTEM', new Date(NOW));
        });
    });

    describe('Get Chat Messages', () => {
        it('should verify participant, retrieve and return messages with correct format', async () => {
            const chatId = 'chat-123';
            const userId = 'user-456';
            const messageIds = ['msg-1', 'msg-2'];
            const messages: ChatMessage[] = [
                {
                    messageId: 'msg-1',
                    userId: 'user-456',
                    message: 'Hello',
                    timestamp: new Date(NOW)
                },
                {
                    messageId: 'msg-2',
                    userId: 'user-789',
                    message: 'Hi there',
                    timestamp: new Date(NOW + 1000)
                }
            ];

            mockChatRepository.isParticipant.mockResolvedValue(true);
            mockChatRepository.getChatMessageIds.mockResolvedValue(messageIds);
            mockMessageRepository.getMessageBatch.mockResolvedValue(messages);

            const result = await chatService.getChatMessages(chatId, userId);

            expect(mockChatRepository.isParticipant).toHaveBeenCalledWith(chatId, userId);
            expect(mockChatRepository.getChatMessageIds).toHaveBeenCalledWith(chatId);
            expect(mockMessageRepository.getMessageBatch).toHaveBeenCalledWith(messageIds);
            expect(result).toEqual(messages);
        });

        it('should throw ForbiddenError when user is not a participant', async () => {
            const chatId = 'chat-123';
            const userId = 'user-456';

            mockChatRepository.isParticipant.mockResolvedValue(false);

            await expect(chatService.getChatMessages(chatId, userId)).rejects.toThrow(ForbiddenError);
            await expect(chatService.getChatMessages(chatId, userId)).rejects.toThrow(
                'User is not a member of the chat'
            );
        });

        it('should return empty array for chat with no messages', async () => {
            const chatId = 'chat-123';
            const userId = 'user-456';
            const messageIds: string[] = [];
            const messages: ChatMessage[] = [];

            mockChatRepository.isParticipant.mockResolvedValue(true);
            mockChatRepository.getChatMessageIds.mockResolvedValue(messageIds);
            mockMessageRepository.getMessageBatch.mockResolvedValue(messages);

            const result = await chatService.getChatMessages(chatId, userId);

            expect(result).toEqual([]);
            expect(mockMessageRepository.getMessageBatch).toHaveBeenCalledWith([]);
        });
    });
});
