import { useEffect, useState } from 'react';
import { joinChat, leaveChat } from '@/lib/clients/core.socket.client';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { getChatMessages } from '@/lib/clients/core.rest.client';
import { ChatMessage, ChatMessagesUpdatedMessage } from '@/lib/models/chat/chat';
import { toast } from 'sonner';
import { SocketErrorPayload } from '@/lib/models/errors/socket-error';
import { getUserFriendlyErrorMessage } from '@/lib/utils/error-message.utils';

function useChat(chatId: string | undefined, disableFetch: boolean = false) {
    const { socket } = useCoreSocket();
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        if (!socket) return;
        const handleChatMessagesUpdated = (request: ChatMessagesUpdatedMessage) => {
            setMessages(request.chatMessages);
        };

        const handleChatError = (error: SocketErrorPayload) => {
            const friendlyMessage = getUserFriendlyErrorMessage(error.message, error.code, 'chat');
            toast.error(friendlyMessage);
        };

        socket.on('chat-messages-updated', handleChatMessagesUpdated);
        socket.on('chat-error', handleChatError);

        return () => {
            socket.off('chat-messages-updated', handleChatMessagesUpdated);
            socket.off('chat-error', handleChatError);
        };
    }, [socket]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!socket || !chatId || disableFetch) return;
            try {
                const response = await joinChat(socket, chatId);
                if (!response.success) {
                    return;
                }
                const messagesResponse = await getChatMessages(chatId);
                setMessages(messagesResponse);
            } catch (error) {
                toast.error('Failed to load chat messages');
                console.error('Failed to fetch chat messages:', error);
                setMessages([]);
            }
        };

        fetchMessages();

        return () => {
            if (!socket || !chatId) return;
            leaveChat(socket, chatId);
        };
    }, [chatId, disableFetch, socket]);

    return {
        messages
    };
}

export default useChat;
