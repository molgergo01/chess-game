import { socket } from '@/lib/config/socket.io.config';
import { MoveResponse, PositionResponse } from '@/lib/models/response/game';
import { MoveRequest, PositionRequest } from '@/lib/models/request/game';

export async function movePiece(
    sourceSquare: string,
    targetSquare: string,
    promotionPiece: string | undefined
): Promise<MoveResponse> {
    const requestBody: MoveRequest = {
        from: sourceSquare,
        to: targetSquare,
        gameId: '1',
        promotionPiece: promotionPiece
    };

    return socket.emitWithAck('movePiece', requestBody);
}

export function getPosition(): Promise<PositionResponse> {
    const requestBody: PositionRequest = {
        gameId: '1'
    };

    return socket.emitWithAck('getPosition', requestBody);
}

export function resetGame() {
    socket.emit('resetGame');
}
