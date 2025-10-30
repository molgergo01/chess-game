import { MoveResponse } from '@/lib/models/response/game';
import { JoinGameRequest, MoveRequest } from '@/lib/models/request/game';
import { Socket } from 'socket.io-client';

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
