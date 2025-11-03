import { Server, Socket } from 'socket.io';
import container from '../config/container';
import { JoinChatRoomRequest, LeaveChatRoomRequest, SendChatMessageRequest } from '../models/requests';
import ChatService from '../services/chat.service';
import ChatNotificationService from '../services/chat.notification.service';
import { handleCoreSocketError } from '../middlewares/core.socket.error.handler';

const chatService = container.get(ChatService);
const chatNotificationService = container.get(ChatNotificationService);

const chatListener = (io: Server, socket: Socket) => {
    const joinChat = async function (request: JoinChatRoomRequest) {
        try {
            socket.join(request.chatId);
            await chatService.addParticipant(request.chatId, socket.data.user!.id);
        } catch (error) {
            handleCoreSocketError(
                io,
                socket,
                error as Error,
                {
                    operation: 'joinChat',
                    userId: socket.data.user?.id,
                    chatId: request.chatId
                },
                'chat-error'
            );
        }
    };

    const leaveChat = async function (request: LeaveChatRoomRequest) {
        try {
            await chatService.removeParticipant(request.chatId, socket.data.user!.id);
            socket.leave(request.chatId);
        } catch (error) {
            handleCoreSocketError(
                io,
                socket,
                error as Error,
                {
                    operation: 'leaveChat',
                    userId: socket.data.user?.id,
                    chatId: request.chatId
                },
                'chat-error'
            );
        }
    };

    const sendChatMessage = async function (request: SendChatMessageRequest) {
        try {
            await chatService.createChatMessage(request.chatId, socket.data.user!.id, request.message);

            const chatMessages = await chatService.getChatMessages(request.chatId, socket.data.user!.id);
            chatNotificationService.sendChatMessagesUpdatedNotification(request.chatId, chatMessages);
        } catch (error) {
            handleCoreSocketError(
                io,
                socket,
                error as Error,
                {
                    operation: 'sendChatMessage',
                    userId: socket.data.user?.id,
                    chatId: request.chatId
                },
                'chat-error'
            );
        }
    };

    return {
        joinChat,
        leaveChat,
        sendChatMessage
    };
};

export default chatListener;
