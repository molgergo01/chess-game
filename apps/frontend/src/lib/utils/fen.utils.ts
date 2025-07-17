import { PieceDataType } from 'react-chessboard';
import Fen, { BOARD_CONTENT, BoardContent } from 'chess-fen';
import { Color } from '@/lib/models/request/matchmaking';

export function getTurnColor(boardPosition: Fen): Color | undefined {
    if (boardPosition.toString() === Fen.emptyPosition) return undefined;
    return boardPosition.toMove as Color;
}

export function mapPieceToBoardContent(
    piece: PieceDataType,
    targetSquare: string
): BoardContent {
    const color: string = piece.pieceType.charAt(0);
    let pieceType: string = piece.pieceType.charAt(1);
    const targetSquareNumber = targetSquare.charAt(1);

    if (isPromotion(pieceType, color, targetSquareNumber)) {
        pieceType = 'q';
    }

    const contentString =
        color === 'w' ? pieceType.toUpperCase() : pieceType.toLowerCase();

    return contentString as BoardContent;
}

export function isPromotion(
    pieceType: string,
    color: string,
    targetSquareNumber: string | undefined
): boolean {
    return (
        (pieceType === 'P' || pieceType === 'p') &&
        ((targetSquareNumber === '8' && color === 'w') ||
            (targetSquareNumber === '1' && color === 'b'))
    );
}

export function updatePosition(
    boardPosition: Fen,
    sourceSquare: string,
    targetSquare: string,
    piece: PieceDataType
): Fen {
    return boardPosition
        .update(sourceSquare, BOARD_CONTENT[' '])
        .update(targetSquare, mapPieceToBoardContent(piece, targetSquare));
}
