import { renderHook, waitFor, act } from '@testing-library/react';
import { Socket } from 'socket.io-client';

jest.mock('next/navigation');
jest.mock('@/lib/clients/core.socket.client');
jest.mock('@/hooks/chess/useCoreSocket', () => ({
    useCoreSocket: jest.fn()
}));

import useGameId from '@/hooks/chess/useGameId';
import { useRouter } from 'next/navigation';
import { getGameId, joinGame } from '@/lib/clients/core.socket.client';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';

type RouterInstance = ReturnType<typeof useRouter>;

describe('useGameId', () => {
    const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
    const mockGetGameId = getGameId as jest.MockedFunction<typeof getGameId>;
    const mockJoinGame = joinGame as jest.MockedFunction<typeof joinGame>;
    const mockUseCoreSocket = useCoreSocket as jest.MockedFunction<
        typeof useCoreSocket
    >;

    let mockRouter: Pick<RouterInstance, 'push'>;
    let mockSocket: Partial<Socket>;

    beforeEach(() => {
        mockRouter = {
            push: jest.fn()
        };

        mockSocket = {
            id: 'mock-socket-id',
            connected: true,
            on: jest.fn(),
            emit: jest.fn(),
            off: jest.fn()
        };

        mockUseRouter.mockReturnValue(mockRouter as RouterInstance);
        mockUseCoreSocket.mockReturnValue({ socket: mockSocket as Socket });

        jest.clearAllMocks();
    });

    it('should initialize gameId when socket is available', async () => {
        mockGetGameId.mockResolvedValue({ gameId: 'game123' });

        const { result } = renderHook(() => useGameId());

        await waitFor(() => {
            expect(result.current[0]).toBe('game123');
        });

        expect(mockGetGameId).toHaveBeenCalledWith(mockSocket);
        expect(mockJoinGame).toHaveBeenCalledWith(mockSocket, 'game123');
    });

    it('should navigate to /play when gameId is not available', async () => {
        mockGetGameId.mockResolvedValue({ gameId: null });

        renderHook(() => useGameId());

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/play');
        });

        expect(mockJoinGame).not.toHaveBeenCalled();
    });

    it('should not initialize when socket is null', () => {
        mockUseCoreSocket.mockReturnValue({ socket: null });

        const { result } = renderHook(() => useGameId());

        expect(result.current[0]).toBeUndefined();
        expect(mockGetGameId).not.toHaveBeenCalled();
    });

    it('should not reinitialize if gameId is already set', async () => {
        mockGetGameId.mockResolvedValue({ gameId: 'game123' });

        const { result, rerender } = renderHook(() => useGameId());

        await waitFor(() => {
            expect(result.current[0]).toBe('game123');
        });

        expect(mockGetGameId).toHaveBeenCalledTimes(1);

        rerender();

        await waitFor(() => {
            expect(mockGetGameId).toHaveBeenCalledTimes(1);
        });
    });

    it('should allow manual gameId update via setGameId', async () => {
        mockGetGameId.mockResolvedValue({ gameId: 'game123' });

        const { result } = renderHook(() => useGameId());

        await waitFor(() => {
            expect(result.current[0]).toBe('game123');
        });

        act(() => {
            result.current[1]('game456');
        });

        await waitFor(() => {
            expect(result.current[0]).toBe('game456');
        });
    });
});
