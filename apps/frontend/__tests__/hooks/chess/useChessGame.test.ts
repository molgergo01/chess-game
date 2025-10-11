jest.mock('@/hooks/chess/useGameId');
jest.mock('@/hooks/chess/useCoreSocket');
jest.mock('@/hooks/auth/useAuth');
jest.mock('@/lib/clients/core.socket.client');
jest.mock('@/lib/utils/game.utils');

import { act, renderHook, waitFor } from '@testing-library/react';
import useChessGame from '@/hooks/chess/useChessGame';
import useGameId from '@/hooks/chess/useGameId';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { useAuth } from '@/hooks/auth/useAuth';
import { getPosition, getTimes, movePiece } from '@/lib/clients/core.socket.client';
import { getCurrentUserColor } from '@/lib/utils/game.utils';
import { Socket } from 'socket.io-client';
import Fen from 'chess-fen';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import { Winner } from '@/lib/models/response/game';
import type { PieceDropHandlerArgs } from 'react-chessboard';

describe('useChessGame', () => {
    const mockUseGameId = useGameId as jest.MockedFunction<typeof useGameId>;
    const mockUseCoreSocket = useCoreSocket as jest.MockedFunction<typeof useCoreSocket>;
    const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
    const mockGetPosition = getPosition as jest.MockedFunction<typeof getPosition>;
    const mockGetTimes = getTimes as jest.MockedFunction<typeof getTimes>;
    const mockMovePiece = movePiece as jest.MockedFunction<typeof movePiece>;
    const mockGetCurrentUserColor = getCurrentUserColor as jest.MockedFunction<typeof getCurrentUserColor>;

    let mockSocket: Partial<Socket>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let socketEventHandlers: Record<string, (...args: any[]) => void>;

    const createMockPieceDropArgs = (
        sourceSquare: string,
        targetSquare: string,
        pieceType: string
    ): PieceDropHandlerArgs => ({
        sourceSquare,
        targetSquare,
        piece: {
            pieceType,
            isSparePiece: false,
            position: sourceSquare
        }
    });

    beforeEach(() => {
        socketEventHandlers = {};

        mockSocket = {
            id: 'mock-socket-id',
            connected: true,
            on: jest.fn(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (event: string, handler: (...args: any[]) => void) => {
                    socketEventHandlers[event] = handler;
                    return mockSocket as Socket;
                }
            ),
            emit: jest.fn(),
            off: jest.fn(),
            emitWithAck: jest.fn()
        };

        mockUseCoreSocket.mockReturnValue({ socket: mockSocket as Socket });
        mockUseAuth.mockReturnValue({
            userId: 'user123',
            refetch: jest.fn()
        });
        mockGetCurrentUserColor.mockReturnValue(MatchmakingColor.WHITE);

        jest.clearAllMocks();
        console.log = jest.fn();
    });

    it('should initialize board position when gameId is available', async () => {
        const setGameId = jest.fn();
        mockUseGameId.mockReturnValue(['game123', setGameId]);

        mockGetPosition.mockResolvedValue({
            position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            gameOver: false,
            winner: null
        });

        mockGetTimes.mockResolvedValue({
            playerTimes: {
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000
            }
        });

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(result.current.boardPosition.toString()).not.toBe(Fen.emptyPosition);
        });

        expect(mockGetPosition).toHaveBeenCalledWith(mockSocket, 'game123');
        expect(result.current.boardPosition.toString()).toBe(
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        );
    });

    it('should set gameOver when game is over', async () => {
        const setGameId = jest.fn();
        mockUseGameId.mockReturnValue(['game123', setGameId]);

        mockGetPosition.mockResolvedValue({
            position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            gameOver: true,
            winner: Winner.WHITE
        });

        mockGetTimes.mockResolvedValue({
            playerTimes: {
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000
            }
        });

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(result.current.gameOver).toBe(true);
        });

        expect(result.current.winner).toBe(Winner.WHITE);
        expect(setGameId).toHaveBeenCalledWith(undefined);
    });

    it('should update position when update-position event is received', async () => {
        const setGameId = jest.fn();
        mockUseGameId.mockReturnValue(['game123', setGameId]);

        mockGetPosition.mockResolvedValue({
            position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            gameOver: false,
            winner: null
        });

        mockGetTimes.mockResolvedValue({
            playerTimes: {
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000
            }
        });

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(mockSocket.on).toHaveBeenCalledWith('update-position', expect.any(Function));
        });

        act(() => {
            socketEventHandlers['update-position']({
                position: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
                playerTimes: {
                    whiteTimeRemaining: 590000,
                    blackTimeRemaining: 600000
                },
                isGameOver: false,
                winner: null
            });
        });

        await waitFor(() => {
            expect(result.current.boardPosition.toString()).toBe(
                'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
            );
        });

        expect(result.current.timesRemaining).toEqual({
            whiteTimeRemaining: 590000,
            blackTimeRemaining: 600000
        });
    });

    it('should handle game over on update-position event', async () => {
        const setGameId = jest.fn();
        mockUseGameId.mockReturnValue(['game123', setGameId]);

        mockGetPosition.mockResolvedValue({
            position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            gameOver: false,
            winner: null
        });

        mockGetTimes.mockResolvedValue({
            playerTimes: {
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000
            }
        });

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(mockSocket.on).toHaveBeenCalled();
        });

        act(() => {
            socketEventHandlers['update-position']({
                position: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
                playerTimes: {
                    whiteTimeRemaining: 590000,
                    blackTimeRemaining: 600000
                },
                isGameOver: true,
                winner: Winner.WHITE
            });
        });

        await waitFor(() => {
            expect(result.current.gameOver).toBe(true);
        });

        expect(result.current.winner).toBe(Winner.WHITE);
    });

    it('should handle time-expired event', async () => {
        const setGameId = jest.fn();
        mockUseGameId.mockReturnValue(['game123', setGameId]);

        mockGetPosition.mockResolvedValue({
            position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            gameOver: false,
            winner: null
        });

        mockGetTimes.mockResolvedValue({
            playerTimes: {
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000
            }
        });

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(mockSocket.on).toHaveBeenCalledWith('time-expired', expect.any(Function));
        });

        act(() => {
            socketEventHandlers['time-expired']({
                winner: Winner.BLACK
            });
        });

        await waitFor(() => {
            expect(result.current.gameOver).toBe(true);
        });

        expect(result.current.winner).toBe(Winner.BLACK);
        expect(result.current.timesRemaining).toEqual({
            whiteTimeRemaining: 0,
            blackTimeRemaining: 0
        });
    });

    it('should set user color when userId is available', async () => {
        const setGameId = jest.fn();
        mockUseGameId.mockReturnValue(['game123', setGameId]);

        mockGetPosition.mockResolvedValue({
            position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            gameOver: false,
            winner: null
        });

        mockGetTimes.mockResolvedValue({
            playerTimes: {
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000
            }
        });

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(result.current.color).toBe(MatchmakingColor.WHITE);
        });

        expect(mockGetCurrentUserColor).toHaveBeenCalledWith('user123');
    });

    it('should handle piece drop successfully', async () => {
        const setGameId = jest.fn();
        mockUseGameId.mockReturnValue(['game123', setGameId]);

        mockGetPosition.mockResolvedValue({
            position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            gameOver: false,
            winner: null
        });

        mockGetTimes.mockResolvedValue({
            playerTimes: {
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000
            }
        });

        mockMovePiece.mockResolvedValue({
            success: true,
            position: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
        });

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(result.current.boardPosition.toString()).toBe(
                'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
            );
        });

        let dropResult: boolean = false;
        await act(async () => {
            dropResult = result.current.onDrop(createMockPieceDropArgs('e2', 'e4', 'wP'));
        });

        expect(dropResult).toBe(true);
        expect(mockMovePiece).toHaveBeenCalledWith(mockSocket, 'game123', 'e2', 'e4', undefined);
    });

    it('should return false on piece drop when gameId is not available', async () => {
        const setGameId = jest.fn();
        mockUseGameId.mockReturnValue([undefined, setGameId]);

        mockGetTimes.mockResolvedValue({
            playerTimes: {
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000
            }
        });

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(result.current.onDrop).toBeDefined();
        });

        const dropResult = result.current.onDrop(createMockPieceDropArgs('e2', 'e4', 'wP'));

        expect(dropResult).toBe(false);
        expect(mockMovePiece).not.toHaveBeenCalled();
    });

    it('should handle promotion pieces', async () => {
        const setGameId = jest.fn();
        mockUseGameId.mockReturnValue(['game123', setGameId]);

        mockGetPosition.mockResolvedValue({
            position: 'rnbqkb1r/ppppppPp/8/8/8/8/PPPPPPP1/RNBQKBNR w KQkq - 0 1',
            gameOver: false,
            winner: null
        });

        mockGetTimes.mockResolvedValue({
            playerTimes: {
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000
            }
        });

        mockMovePiece.mockResolvedValue({
            success: true,
            position: 'rnbqkbQr/pppppp1p/8/8/8/8/PPPPPPP1/RNBQKBNR b KQkq - 0 1'
        });

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(result.current.boardPosition.toString()).not.toBe(Fen.emptyPosition);
        });

        await act(async () => {
            result.current.onDrop(createMockPieceDropArgs('g7', 'g8', 'wP'));
        });

        expect(mockMovePiece).toHaveBeenCalledWith(mockSocket, 'game123', 'g7', 'g8', 'q');
    });

    it('should cleanup socket listeners on unmount', async () => {
        const setGameId = jest.fn();
        mockUseGameId.mockReturnValue(['game123', setGameId]);

        mockGetPosition.mockResolvedValue({
            position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            gameOver: false,
            winner: null
        });

        mockGetTimes.mockResolvedValue({
            playerTimes: {
                whiteTimeRemaining: 600000,
                blackTimeRemaining: 600000
            }
        });

        const { unmount } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(mockSocket.on).toHaveBeenCalled();
        });

        unmount();

        expect(mockSocket.off).toHaveBeenCalledWith('update-position', expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith('time-expired', expect.any(Function));
    });
});
