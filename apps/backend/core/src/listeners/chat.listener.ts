import { Server, Socket } from 'socket.io';
import container from '../config/container';
import { JoinChatRoomRequest, LeaveChatRoomRequest, SendChatMessageRequest } from '../models/requests';
import ChatService from '../services/chat.service';
import ChatNotificationService from '../services/chat.notification.service';

const chatService = container.get(ChatService);
const chatNotificationService = container.get(ChatNotificationService);

const chatListener = (io: Server, socket: Socket) => {
    const joinChat = async function (request: JoinChatRoomRequest) {
        socket.join(request.chatId);
        await chatService.addParticipant(request.chatId, socket.data.user!.id);
    };

    const leaveChat = async function (request: LeaveChatRoomRequest) {
        await chatService.removeParticipant(request.chatId, socket.data.user!.id);
        socket.leave(request.chatId);
    };

    const sendChatMessage = async function (request: SendChatMessageRequest) {
        await chatService.createChatMessage(request.chatId, socket.data.user!.id, request.message);

        const chatMessages = await chatService.getChatMessages(request.chatId, socket.data.user!.id);
        chatNotificationService.sendChatMessagesUpdatedNotification(request.chatId, chatMessages);
    };

    return {
        joinChat,
        leaveChat,
        sendChatMessage
    };
};

export default chatListener;
