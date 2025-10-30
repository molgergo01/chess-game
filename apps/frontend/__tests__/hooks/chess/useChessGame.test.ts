jest.mock('@/hooks/chess/useCoreSocket');
jest.mock('@/hooks/auth/useAuth');
jest.mock('@/lib/clients/core.socket.client');
jest.mock('@/lib/clients/core.rest.client');
jest.mock('@/lib/utils/game.utils');
jest.mock('next/navigation');

import { act, renderHook, waitFor } from '@testing-library/react';
import useChessGame from '@/hooks/chess/useChessGame';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { useAuth } from '@/hooks/auth/useAuth';
import { joinGame, movePiece } from '@/lib/clients/core.socket.client';
import { getActiveGame } from '@/lib/clients/core.rest.client';
import { getCurrentUserColor } from '@/lib/utils/game.utils';
import { useRouter } from 'next/navigation';
import { Socket } from 'socket.io-client';
import Fen from 'chess-fen';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import { GetActiveGameResponse, Winner } from '@/lib/models/response/game';
import type { PieceDropHandlerArgs } from 'react-chessboard';

describe('useChessGame', () => {
    const mockUseCoreSocket = useCoreSocket as jest.MockedFunction<typeof useCoreSocket>;
    const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
    const mockJoinGame = joinGame as jest.MockedFunction<typeof joinGame>;
    const mockMovePiece = movePiece as jest.MockedFunction<typeof movePiece>;
    const mockGetActiveGame = getActiveGame as jest.MockedFunction<typeof getActiveGame>;
    const mockGetCurrentUserColor = getCurrentUserColor as jest.MockedFunction<typeof getCurrentUserColor>;
    const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

    let mockSocket: Partial<Socket>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let socketEventHandlers: Record<string, (...args: any[]) => void>;
    const mockRouterPush = jest.fn();

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

    const createMockGameData = (overrides?: Partial<GetActiveGameResponse>): GetActiveGameResponse => ({
        gameId: 'game123',
        whitePlayer: {
            userId: 'user123',
            name: 'White Player',
            elo: 1200,
            avatarUrl: 'white-avatar.jpg'
        },
        blackPlayer: {
            userId: 'user456',
            name: 'Black Player',
            elo: 1300,
            avatarUrl: 'black-avatar.jpg'
        },
        position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        whiteTimeRemaining: 600000,
        blackTimeRemaining: 600000,
        gameOver: false,
        winner: null,
        ...overrides
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
            userName: 'userName',
            userAvatarUrl: 'avatar_url.com',
            refetch: jest.fn()
        });
        mockUseRouter.mockReturnValue({
            push: mockRouterPush,
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn()
        } as never);
        mockGetCurrentUserColor.mockReturnValue(MatchmakingColor.WHITE);

        jest.clearAllMocks();
        console.error = jest.fn();
    });

    it('should initialize board position and game data when user has active game', async () => {
        const gameData = createMockGameData();
        mockGetActiveGame.mockResolvedValue(gameData);

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(result.current.boardPosition.toString()).not.toBe(Fen.emptyPosition);
        });

        expect(mockGetActiveGame).toHaveBeenCalled();
        expect(result.current.boardPosition.toString()).toBe(
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        );
        expect(result.current.whitePlayer).toEqual(gameData.whitePlayer);
        expect(result.current.blackPlayer).toEqual(gameData.blackPlayer);
        expect(result.current.timesRemaining).toEqual({
            whiteTimeRemaining: 600000,
            blackTimeRemaining: 600000
        });
        expect(mockJoinGame).toHaveBeenCalledWith(mockSocket, 'game123');
    });

    it('should set gameOver and not join game when game is already over', async () => {
        const gameData = createMockGameData({
            gameOver: true,
            winner: Winner.WHITE
        });
        mockGetActiveGame.mockResolvedValue(gameData);

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(result.current.gameOver).toBe(true);
        });

        expect(result.current.winner).toBe(Winner.WHITE);
        expect(mockJoinGame).not.toHaveBeenCalled();
    });

    it('should update position when update-position event is received', async () => {
        const gameData = createMockGameData();
        mockGetActiveGame.mockResolvedValue(gameData);

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
        const gameData = createMockGameData();
        mockGetActiveGame.mockResolvedValue(gameData);

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
        const gameData = createMockGameData();
        mockGetActiveGame.mockResolvedValue(gameData);

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

    it('should set user color when userId and players are available', async () => {
        const gameData = createMockGameData();
        mockGetActiveGame.mockResolvedValue(gameData);

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(result.current.color).toBe(MatchmakingColor.WHITE);
        });

        expect(mockGetCurrentUserColor).toHaveBeenCalledWith('user123', gameData.whitePlayer, gameData.blackPlayer);
    });

    it('should handle piece drop successfully', async () => {
        const gameData = createMockGameData();
        mockGetActiveGame.mockResolvedValue(gameData);

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

    it('should return false on piece drop when game is over', async () => {
        const gameData = createMockGameData({
            gameOver: true,
            winner: Winner.WHITE
        });
        mockGetActiveGame.mockResolvedValue(gameData);

        const { result } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(result.current.gameOver).toBe(true);
        });

        const dropResult = result.current.onDrop(createMockPieceDropArgs('e2', 'e4', 'wP'));

        expect(dropResult).toBe(false);
        expect(mockMovePiece).not.toHaveBeenCalled();
    });

    it('should handle promotion pieces', async () => {
        const gameData = createMockGameData({
            position: 'rnbqkb1r/ppppppPp/8/8/8/8/PPPPPPP1/RNBQKBNR w KQkq - 0 1'
        });
        mockGetActiveGame.mockResolvedValue(gameData);

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
        const gameData = createMockGameData();
        mockGetActiveGame.mockResolvedValue(gameData);

        const { unmount } = renderHook(() => useChessGame());

        await waitFor(() => {
            expect(mockSocket.on).toHaveBeenCalled();
        });

        unmount();

        expect(mockSocket.off).toHaveBeenCalledWith('update-position', expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith('time-expired', expect.any(Function));
    });

    it('should handle error when fetching game data fails', async () => {
        mockGetActiveGame.mockRejectedValue(new Error('Failed to get active game'));

        renderHook(() => useChessGame());

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Failed to fetch game data:', expect.any(Error));
        });

        expect(mockRouterPush).toHaveBeenCalledWith('/play');
    });

    it('should not call getActiveGame when socket is not available', async () => {
        mockUseCoreSocket.mockReturnValue({ socket: null as never });

        renderHook(() => useChessGame());

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(mockGetActiveGame).not.toHaveBeenCalled();
    });
});
