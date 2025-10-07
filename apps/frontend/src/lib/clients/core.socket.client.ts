import { GetGameIdResponse, GetTimesResponse, MoveResponse, PositionResponse } from '@/lib/models/response/game';
import { GetTimesRequest, JoinGameRequest, MoveRequest, PositionRequest } from '@/lib/models/request/game';
import { Socket } from 'socket.io-client';

export function getGameId(socket: Socket): Promise<GetGameIdResponse> {
    return socket.emitWithAck('getGameId');
}

export function getTimes(socket: Socket, gameId: string): Promise<GetTimesResponse> {
    const requestBody: GetTimesRequest = {
        gameId: gameId
    };

    return socket.emitWithAck('getTimes', requestBody);
}
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

export function getPosition(socket: Socket, gameId: string): Promise<PositionResponse> {
    const requestBody: PositionRequest = {
        gameId: gameId
    };

    return socket.emitWithAck('getPosition', requestBody);
}
