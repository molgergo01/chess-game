import { useEffect, useState } from 'react';
import { joinChat, leaveChat } from '@/lib/clients/core.socket.client';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { getChatMessages } from '@/lib/clients/core.rest.client';
import { ChatMessage, ChatMessagesUpdatedMessage } from '@/lib/models/chat/chat';

function useChat(chatId: string | undefined) {
    const { socket } = useCoreSocket();
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        if (!socket) return;
        const handleChatMessagesUpdated = (request: ChatMessagesUpdatedMessage) => {
            setMessages(request.chatMessages);
        };

        socket.on('chat-messages-updated', handleChatMessagesUpdated);

        return () => {
            socket.off('chat-messages-updated', handleChatMessagesUpdated);
        };
    }, [socket]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!socket || !chatId) return;
            try {
                joinChat(socket, chatId);
                const messagesResponse = await getChatMessages(chatId);
                setMessages(messagesResponse);
            } catch (error) {
                console.error('Failed to fetch chat messages:', error);
                setMessages([]);
            }
        };

        fetchMessages();

        return () => {
            if (!socket || !chatId) return;
            leaveChat(socket, chatId);
        };
    }, [chatId, socket]);

    return {
        messages
    };
}

export default useChat;
