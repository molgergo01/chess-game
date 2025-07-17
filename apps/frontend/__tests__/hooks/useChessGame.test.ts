import { act, renderHook } from '@testing-library/react';
import useChessGame from '@/hooks/chess/useChessGame';
import * as fenUtils from '@/lib/utils/fen.utils';
import * as gameClient from '@/lib/clients/game.client';
import Fen from 'chess-fen';
import { Winner } from '@/lib/models/response/game';

jest.mock('@/lib/clients/game.client');
jest.mock('@/lib/utils/fen.utils');

const mockFenString = Fen.startingPosition;
const mockFen = new Fen(mockFenString);

const getPositionMock = gameClient.getPosition as jest.Mock;
const movePieceMock = gameClient.movePiece as jest.Mock;
const resetGameMock = gameClient.resetGame as jest.Mock;
const updatePositionMock = fenUtils.updatePosition as jest.Mock;
const isPromotionMock = fenUtils.isPromotion as jest.Mock;

describe('useChessGame', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getPositionMock.mockResolvedValue({
            position: mockFenString,
            gameOver: false,
            winner: null
        });
        updatePositionMock.mockReturnValue(mockFen);
        isPromotionMock.mockReturnValue(false);
    });

    it('should initialize with board position and game state', async () => {
        const { result } = renderHook(() => useChessGame());
        // Wait for useEffect to run
        await act(async () => {
            await Promise.resolve();
        });
        expect(result.current.boardPosition.toString()).toBe(mockFenString);
        expect(result.current.gameOver).toBe(false);
        expect(result.current.winner).toBeNull();
    });

    it('should update board on piece drop and call movePiece', async () => {
        movePieceMock.mockResolvedValue({
            success: true,
            position: mockFenString,
            gameOver: false,
            winner: null
        });
        const { result } = renderHook(() => useChessGame());
        await act(async () => {
            await Promise.resolve();
        });
        act(() => {
            result.current.onDrop({
                sourceSquare: 'e2',
                targetSquare: 'e4',
                piece: { isSparePiece: false, pieceType: 'wP', position: 'e7' }
            });
        });
        expect(updatePositionMock).toHaveBeenCalled();
        expect(movePieceMock).toHaveBeenCalledWith('e2', 'e4', undefined);
    });

    it('should promote to queen if promotion detected', async () => {
        isPromotionMock.mockReturnValue(true);
        movePieceMock.mockResolvedValue({
            success: true,
            position: mockFenString,
            gameOver: false,
            winner: null
        });
        const { result } = renderHook(() => useChessGame());
        await act(async () => {
            await Promise.resolve();
        });
        act(() => {
            result.current.onDrop({
                sourceSquare: 'e7',
                targetSquare: 'e8',
                piece: { isSparePiece: false, pieceType: 'wP', position: 'e7' }
            });
        });
        expect(movePieceMock).toHaveBeenCalledWith('e7', 'e8', 'q');
    });

    it('should set gameOver and winner if game ends after move', async () => {
        movePieceMock.mockResolvedValue({
            success: true,
            position: mockFenString,
            gameOver: true,
            winner: Winner.WHITE
        });
        const { result } = renderHook(() => useChessGame());
        await act(async () => {
            await Promise.resolve();
        });
        act(() => {
            result.current.onDrop({
                sourceSquare: 'e7',
                targetSquare: 'e8',
                piece: { isSparePiece: false, pieceType: 'wP', position: 'e7' }
            });
        });
        // Wait for async movePiece
        await act(async () => {
            await Promise.resolve();
        });
        expect(result.current.gameOver).toBe(true);
        expect(result.current.winner).toBe(Winner.WHITE);
    });

    it('should reset the game state', async () => {
        const { result } = renderHook(() => useChessGame());

        await act(async () => {
            result.current.reset();
            await Promise.resolve();
        });

        expect(resetGameMock).toHaveBeenCalled();
        expect(result.current.boardPosition.toString()).toBe(
            Fen.startingPosition
        );
        expect(result.current.gameOver).toBe(false);
        expect(result.current.winner).toBeNull();
    });
});
