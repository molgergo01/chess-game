import {
    getFen,
    getWinner,
    isGameOver,
    move,
    reset
} from '../../src/services/game.service';
import { Winner } from '../../src/models/game';
import {
    getGameState,
    removeGameState
} from '../../src/repositories/gameStateRepository';

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

jest.mock('../../src/repositories/gameStateRepository', () => ({
    getGameState: jest
        .fn()
        .mockResolvedValue(
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        ),
    saveGameState: jest.fn(),
    removeGameState: jest.fn()
}));

describe('move', () => {
    it('should return correct fen on valid move', async () => {
        const expected =
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const actual = await move('1', 'e2', 'e3', 'wQ');

        expect(actual).toBe(expected);

        const mockChessInstance =
            jest.requireMock('chess.js').Chess.mock.results[0].value;
        expect(mockChessInstance.move).toHaveBeenCalledWith({
            from: 'e2',
            to: 'e3',
            promotion: 'wQ'
        });
    });
    it('should throw error if game not found', async () => {
        (getGameState as jest.Mock).mockResolvedValueOnce(null);

        await expect(move('missingId', 'e2', 'e3', 'wQ')).rejects.toThrow(
            'Game with id missingId could not be found'
        );
    });
});

describe('getFen', () => {
    it('should return correct fen', async () => {
        const expected =
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const actual = await getFen('1');

        expect(actual).toBe(expected);

        const mockChessInstance =
            jest.requireMock('chess.js').Chess.mock.results[0].value;
        expect(mockChessInstance.fen).toHaveBeenCalled();
    });
    it('should throw error if game not found', async () => {
        (getGameState as jest.Mock).mockResolvedValueOnce(null);

        await expect(getFen('missingId')).rejects.toThrow(
            'Game with id missingId could not be found'
        );
    });
});

describe('isGameOver', () => {
    it('should return gameOver', async () => {
        const actual = await isGameOver('1');

        expect(actual).toBe(false);

        const mockChessInstance =
            jest.requireMock('chess.js').Chess.mock.results[0].value;
        expect(mockChessInstance.isGameOver).toHaveBeenCalled();
    });
    it('should throw error if game not found', async () => {
        (getGameState as jest.Mock).mockResolvedValueOnce(null);

        await expect(isGameOver('missingId')).rejects.toThrow(
            'Game with id missingId could not be found'
        );
    });
});

describe('getWinner', () => {
    it('should return draw if game is drawn', async () => {
        const expected = Winner.DRAW;
        const actual = await getWinner('1');

        expect(actual).toBe(expected);
    });

    it('should return winner if game is not drawn', async () => {
        const expected = Winner.BLACK;

        const mockChessInstance =
            jest.requireMock('chess.js').Chess.mock.results[0].value;
        mockChessInstance.isDraw.mockReturnValueOnce(false);
        mockChessInstance.isCheckmate.mockReturnValueOnce(true);

        const actual = await getWinner('1');

        expect(actual).toBe(expected);
    });

    it('should return null if game is not over', async () => {
        const mockChessInstance =
            jest.requireMock('chess.js').Chess.mock.results[0].value;
        mockChessInstance.isDraw.mockReturnValueOnce(false);

        const actual = await getWinner('1');

        expect(actual).toBeNull();
    });
    it('should throw error if game not found', async () => {
        (getGameState as jest.Mock).mockResolvedValueOnce(null);

        await expect(getWinner('missingId')).rejects.toThrow(
            'Game with id missingId could not be found'
        );
    });
});

describe('resetGame', () => {
    it('should reset game', async () => {
        await reset('1');

        expect(removeGameState).toHaveBeenCalledWith('1');
    });
});
