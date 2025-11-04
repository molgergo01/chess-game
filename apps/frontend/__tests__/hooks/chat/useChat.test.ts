jest.mock('@/hooks/chess/useCoreSocket');
jest.mock('@/lib/clients/core.socket.client');
jest.mock('@/lib/clients/core.rest.client');

import { act, renderHook, waitFor } from '@testing-library/react';
import useChat from '@/hooks/chat/useChat';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { joinChat, leaveChat } from '@/lib/clients/core.socket.client';
import { getChatMessages } from '@/lib/clients/core.rest.client';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '@/lib/models/chat/chat';

describe('useChat', () => {
    const mockUseCoreSocket = useCoreSocket as jest.MockedFunction<typeof useCoreSocket>;
    const mockJoinChat = joinChat as jest.MockedFunction<typeof joinChat>;
    const mockLeaveChat = leaveChat as jest.MockedFunction<typeof leaveChat>;
    const mockGetChatMessages = getChatMessages as jest.MockedFunction<typeof getChatMessages>;

    let mockSocket: Partial<Socket>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let socketEventHandlers: Record<string, (...args: any[]) => void>;

    const createMockMessages = (count: number): ChatMessage[] => {
        return Array.from({ length: count }, (_, i) => ({
            messageId: `msg${i + 1}`,
            userId: `user${i + 1}`,
            message: `Test message ${i + 1}`,
            timestamp: new Date()
        }));
    };

    beforeEach(() => {
        socketEventHandlers = {};

        mockSocket = {
            id: 'mock-socket-id',
            connected: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            on: jest.fn((event: string, handler: (...args: any[]) => void) => {
                socketEventHandlers[event] = handler;
                return mockSocket as Socket;
            }),
            emit: jest.fn(),
            off: jest.fn(),
            emitWithAck: jest.fn()
        };

        mockUseCoreSocket.mockReturnValue({ socket: mockSocket as Socket });
        mockJoinChat.mockResolvedValue({ success: true });

        jest.clearAllMocks();
        console.error = jest.fn();
    });

    it('should initialize with empty messages', () => {
        const { result } = renderHook(() => useChat(undefined));

        expect(result.current.messages).toEqual([]);
    });

    it('should fetch and set messages when chatId and socket are available', async () => {
        const mockMessages = createMockMessages(3);
        mockGetChatMessages.mockResolvedValue(mockMessages);

        const { result } = renderHook(() => useChat('chat123'));

        await waitFor(() => {
            expect(result.current.messages).toEqual(mockMessages);
        });

        expect(mockGetChatMessages).toHaveBeenCalledWith('chat123');
        expect(mockJoinChat).toHaveBeenCalledWith(mockSocket, 'chat123');
    });

    it('should register socket event listener for chat-messages-updated', async () => {
        mockGetChatMessages.mockResolvedValue([]);

        renderHook(() => useChat('chat123'));

        await waitFor(() => {
            expect(mockSocket.on).toHaveBeenCalledWith('chat-messages-updated', expect.any(Function));
        });
    });

    it('should update messages when chat-messages-updated event is received', async () => {
        const initialMessages = createMockMessages(2);
        const updatedMessages = createMockMessages(4);
        mockGetChatMessages.mockResolvedValue(initialMessages);

        const { result } = renderHook(() => useChat('chat123'));

        await waitFor(() => {
            expect(result.current.messages).toEqual(initialMessages);
        });

        act(() => {
            socketEventHandlers['chat-messages-updated']({
                chatMessages: updatedMessages
            });
        });

        await waitFor(() => {
            expect(result.current.messages).toEqual(updatedMessages);
        });
    });

    it('should handle error when fetching messages fails', async () => {
        mockGetChatMessages.mockRejectedValue(new Error('Failed to fetch messages'));

        const { result } = renderHook(() => useChat('chat123'));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Failed to fetch chat messages:', expect.any(Error));
        });

        expect(result.current.messages).toEqual([]);
    });

    it('should not fetch messages when socket is not available', async () => {
        mockUseCoreSocket.mockReturnValue({ socket: null as never });

        renderHook(() => useChat('chat123'));

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(mockGetChatMessages).not.toHaveBeenCalled();
        expect(mockJoinChat).not.toHaveBeenCalled();
    });

    it('should not fetch messages when chatId is undefined', async () => {
        renderHook(() => useChat(undefined));

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(mockGetChatMessages).not.toHaveBeenCalled();
        expect(mockJoinChat).not.toHaveBeenCalled();
    });

    it('should leave chat on unmount', async () => {
        mockGetChatMessages.mockResolvedValue([]);

        const { unmount } = renderHook(() => useChat('chat123'));

        await waitFor(() => {
            expect(mockJoinChat).toHaveBeenCalled();
        });

        unmount();

        expect(mockLeaveChat).toHaveBeenCalledWith(mockSocket, 'chat123');
    });

    it('should cleanup socket listeners on unmount', async () => {
        mockGetChatMessages.mockResolvedValue([]);

        const { unmount } = renderHook(() => useChat('chat123'));

        await waitFor(() => {
            expect(mockSocket.on).toHaveBeenCalled();
        });

        unmount();

        expect(mockSocket.off).toHaveBeenCalledWith('chat-messages-updated', expect.any(Function));
    });

    it('should rejoin chat when chatId changes', async () => {
        mockGetChatMessages.mockResolvedValue([]);

        const { rerender } = renderHook(({ chatId }) => useChat(chatId), {
            initialProps: { chatId: 'chat123' }
        });

        await waitFor(() => {
            expect(mockJoinChat).toHaveBeenCalledWith(mockSocket, 'chat123');
        });

        jest.clearAllMocks();

        rerender({ chatId: 'chat456' });

        await waitFor(() => {
            expect(mockLeaveChat).toHaveBeenCalledWith(mockSocket, 'chat123');
        });

        expect(mockJoinChat).toHaveBeenCalledWith(mockSocket, 'chat456');
        expect(mockGetChatMessages).toHaveBeenCalledWith('chat456');
    });

    it('should not leave chat on unmount when chatId is undefined', async () => {
        const { unmount } = renderHook(() => useChat(undefined));

        await new Promise((resolve) => setTimeout(resolve, 100));

        unmount();

        expect(mockLeaveChat).not.toHaveBeenCalled();
    });

    it('should not leave chat on unmount when socket is not available', async () => {
        mockGetChatMessages.mockResolvedValue([]);

        const { rerender, unmount } = renderHook(() => useChat('chat123'));

        await waitFor(() => {
            expect(mockJoinChat).toHaveBeenCalled();
        });

        mockUseCoreSocket.mockReturnValue({ socket: null as never });
        rerender();

        unmount();

        expect(mockLeaveChat).toHaveBeenCalledTimes(1);
    });
});
