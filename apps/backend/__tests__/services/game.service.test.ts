import {
    getFen,
    getWinner,
    isGameOver,
    move,
    reset
} from '../../src/services/game.service';
import { Winner } from '../../src/models/game';

jest.mock('chess.js', () => {
    return {
        Chess: jest.fn().mockImplementation(() => ({
            fen: jest
                .fn()
                .mockReturnValue(
                    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
                ),
            move: jest.fn(),
            isGameOver: jest.fn().mockReturnValue(false),
            isDraw: jest.fn().mockReturnValue(true),
            isCheckmate: jest.fn().mockReturnValue(false),
            turn: jest.fn().mockReturnValue('w'),
            reset: jest.fn()
        }))
    };
});

describe('move', () => {
    it('should return correct fen on valid move', () => {
        const expected =
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const actual = move('1', 'e2', 'e3');

        expect(actual).toBe(expected);

        const mockChessInstance =
            jest.requireMock('chess.js').Chess.mock.results[0].value;
        expect(mockChessInstance.move).toHaveBeenCalledWith({
            from: 'e2',
            to: 'e3'
        });
    });
});

describe('getFen', () => {
    it('should return correct fen', () => {
        const expected =
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const actual = getFen();

        expect(actual).toBe(expected);

        const mockChessInstance =
            jest.requireMock('chess.js').Chess.mock.results[0].value;
        expect(mockChessInstance.fen).toHaveBeenCalled();
    });
});

describe('isGameOver', () => {
    it('should return gameOver', () => {
        const actual = isGameOver();

        expect(actual).toBe(false);

        const mockChessInstance =
            jest.requireMock('chess.js').Chess.mock.results[0].value;
        expect(mockChessInstance.isGameOver).toHaveBeenCalled();
    });
});

describe('getWinner', () => {
    it('should return draw if game is drawn', () => {
        const expected = Winner.DRAW;
        const actual = getWinner();

        expect(actual).toBe(expected);
    });

    it('should return winner if game is not drawn', () => {
        const expected = Winner.WHITE;

        const mockChessInstance =
            jest.requireMock('chess.js').Chess.mock.results[0].value;
        mockChessInstance.isDraw.mockReturnValueOnce(false);
        mockChessInstance.isCheckmate.mockReturnValueOnce(true);

        const actual = getWinner();

        expect(actual).toBe(expected);
    });

    it('should return null if game is not over', () => {
        const mockChessInstance =
            jest.requireMock('chess.js').Chess.mock.results[0].value;
        mockChessInstance.isDraw.mockReturnValueOnce(false);

        const actual = getWinner();

        expect(actual).toBeNull();
    });
});

describe('resetGame', () => {
    it('should reset game', () => {
        reset();

        const mockChessInstance =
            jest.requireMock('chess.js').Chess.mock.results[0].value;
        expect(mockChessInstance.reset).toHaveBeenCalled();
    });
});
