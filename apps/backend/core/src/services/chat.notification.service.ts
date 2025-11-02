import { Container, inject, injectable } from 'inversify';
import { Server } from 'socket.io';
import { ChatMessage } from '../models/chat';
import { ChatMessagesUpdatedNotification } from '../models/notifications';

@injectable()
class ChatNotificationService {
    constructor(
        @inject('Container')
        private readonly container: Container
    ) {}

    private get io(): Server {
        return this.container.get<Server>('SocketIO');
    }

    sendChatMessagesUpdatedNotification(chatId: string, messages: ChatMessage[]) {
        const message: ChatMessagesUpdatedNotification = {
            chatMessages: messages
        };
        this.io.to(chatId).emit('chat-messages-updated', message);
    }
}

export default ChatNotificationService;
