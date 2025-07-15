import { mapPieceToBoardContent, updatePosition } from '@/lib/utils/fen.utils';
import { PieceDataType } from 'react-chessboard';
import Fen, { BOARD_CONTENT, BoardContent } from 'chess-fen';

describe('mapPieceToBoardContent', () => {
    describe('when piece is white', () => {
        it('should return upper case boardContent', () => {
            const expected: BoardContent = 'R';
            const piece: PieceDataType = {
                pieceType: 'wR'
            };
            const actual = mapPieceToBoardContent(piece, 'e6');
            expect(actual).toEqual(expected);
        });
    });
    describe('when piece is black', () => {
        it('should return lower case boardContent', () => {
            const expected: BoardContent = 'r';
            const piece: PieceDataType = {
                pieceType: 'bR'
            };
            const actual = mapPieceToBoardContent(piece, 'e6');
            expect(actual).toEqual(expected);
        });
    });
    describe('when piece is pawn', () => {
        describe('when targetSquare is on row 8', () => {
            const targetSquare = 'e8';
            describe('when piece is white', () => {
                it('should return white queen', () => {
                    const expected = 'Q';
                    const piece: PieceDataType = {
                        pieceType: 'wP'
                    };
                    const actual = mapPieceToBoardContent(piece, targetSquare);
                    expect(actual).toEqual(expected);
                });
            });
            describe('when piece is black', () => {
                it('should return black pawn', () => {
                    const expected = 'p';
                    const piece: PieceDataType = {
                        pieceType: 'bP'
                    };
                    const actual = mapPieceToBoardContent(piece, targetSquare);
                    expect(actual).toEqual(expected);
                });
            });
        });
        describe('when targetSquare is on row 1', () => {
            const targetSquare = 'e1';
            describe('when piece is white', () => {
                it('should return white pawn', () => {
                    const expected = 'P';
                    const piece: PieceDataType = {
                        pieceType: 'wP'
                    };
                    const actual = mapPieceToBoardContent(piece, targetSquare);
                    expect(actual).toEqual(expected);
                });
            });
            describe('when piece is black', () => {
                it('should return black queen', () => {
                    const expected = 'q';
                    const piece: PieceDataType = {
                        pieceType: 'bP'
                    };
                    const actual = mapPieceToBoardContent(piece, targetSquare);
                    expect(actual).toEqual(expected);
                });
            });
        });
    });
    describe('when piece is not pawn', () => {
        describe('when target square is on row 8', () => {
            const targetSquare = 'e8';
            describe('when piece is white', () => {
                it('should return original piece', () => {
                    const expected = 'R';
                    const piece: PieceDataType = {
                        pieceType: 'wR'
                    };
                    const actual = mapPieceToBoardContent(piece, targetSquare);
                    expect(actual).toEqual(expected);
                });
            });
        });
        describe('when target square is on row 1', () => {
            const targetSquare = 'e1';
            describe('when piece is black', () => {
                it('should return original piece', () => {
                    const expected = 'r';
                    const piece: PieceDataType = {
                        pieceType: 'bR'
                    };
                    const actual = mapPieceToBoardContent(piece, targetSquare);
                    expect(actual).toEqual(expected);
                });
            });
        });
    });
});

describe('updatePosition', () => {
    it('should return updated fen', () => {
        const expected = new Fen();

        const updateSpy = jest.spyOn(expected, 'update').mockReturnThis();

        const actual = updatePosition(expected, 'e1', 'e2', {
            pieceType: 'wR'
        });

        expect(updateSpy).toHaveBeenCalledTimes(2);
        expect(updateSpy).toHaveBeenCalledWith('e1', BOARD_CONTENT[' ']);
        expect(updateSpy).toHaveBeenCalledWith('e2', BOARD_CONTENT['R']);
        expect(actual).toEqual(expected);
    });
});
