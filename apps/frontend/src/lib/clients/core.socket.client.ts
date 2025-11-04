import { MoveResponse } from '@/lib/models/response/game';
import {
    JoinGameRequest,
    MoveRequest,
    OfferDrawRequest,
    ResignRequest,
    RespondDrawOfferRequest,
    SendChatMessageRequest
} from '@/lib/models/request/game';
import { Socket } from 'socket.io-client';
import { JoinChatRequest, JoinChatRoomResponse, LeaveChatRequest } from '@/lib/models/chat/chat';

export function joinGame(socket: Socket, gameId: string) {
    const requestBody: JoinGameRequest = {
        gameId: gameId
    };
    socket.emit('joinGame', requestBody);
}

export async function movePiece(
    socket: Socket,
    gameId: string,
    sourceSquare: string,
    targetSquare: string,
    promotionPiece: string | undefined
): Promise<MoveResponse> {
    const requestBody: MoveRequest = {
        gameId: gameId,
        from: sourceSquare,
        to: targetSquare,
        promotionPiece: promotionPiece
    };

    return socket.emitWithAck('movePiece', requestBody);
}

export async function resign(socket: Socket, gameId: string) {
    const requestBody: ResignRequest = {
        gameId: gameId
    };

    return socket.emit('resign-game', requestBody);
}

export async function offerDraw(socket: Socket, gameId: string) {
    const requestBody: OfferDrawRequest = {
        gameId: gameId
    };

    return socket.emit('offer-draw', requestBody);
}

export async function respondDrawOffer(socket: Socket, gameId: string, accepted: boolean) {
    const requestBody: RespondDrawOfferRequest = {
        gameId: gameId,
        accepted: accepted
    };

    return socket.emit('respond-draw-offer', requestBody);
}

export async function joinChat(socket: Socket, chatId: string): Promise<JoinChatRoomResponse> {
    const requestBody: JoinChatRequest = {
        chatId: chatId
    };
    return socket.emitWithAck('join-chat', requestBody);
}

export function leaveChat(socket: Socket, chatId: string) {
    const requestBody: LeaveChatRequest = {
        chatId: chatId
    };
    socket.emit('leave-chat', requestBody);
}

export async function sendChatMessage(socket: Socket, chatId: string, message: string) {
    const requestBody: SendChatMessageRequest = {
        chatId: chatId,
        message: message
    };

    return socket.emit('send-chat-message', requestBody);
}
