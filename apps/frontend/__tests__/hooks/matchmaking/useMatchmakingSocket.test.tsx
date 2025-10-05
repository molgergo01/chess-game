jest.mock('@/lib/sockets/matchmaking.socket');
jest.mock('@/hooks/auth/useAuth');

import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import {
    MatchmakingSocketProvider,
    useMatchmakingSocket
} from '@/hooks/matchmaking/useMatchmakingSocket';
import { initializeMatchmakingSocket } from '@/lib/sockets/matchmaking.socket';
import { useAuth } from '@/hooks/auth/useAuth';
import { Socket } from 'socket.io-client';

describe('useMatchmakingSocket', () => {
    const mockInitializeMatchmakingSocket =
        initializeMatchmakingSocket as jest.MockedFunction<
            typeof initializeMatchmakingSocket
        >;
    const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

    let mockSocket: Partial<Socket>;

    beforeEach(() => {
        mockSocket = {
            id: 'mock-socket-id',
            connected: true,
            disconnected: false,
            disconnect: jest.fn(),
            on: jest.fn(),
            emit: jest.fn(),
            off: jest.fn()
        };

        mockInitializeMatchmakingSocket.mockReturnValue(mockSocket as Socket);
        jest.clearAllMocks();
    });

    describe('MatchmakingSocketProvider', () => {
        it('should initialize socket when userId is available', async () => {
            mockUseAuth.mockReturnValue({
                userId: 'user123',
                refetch: jest.fn()
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <MatchmakingSocketProvider>
                    {children}
                </MatchmakingSocketProvider>
            );

            const { result } = renderHook(() => useMatchmakingSocket(), {
                wrapper
            });

            await waitFor(() => {
                expect(result.current.socket).toBe(mockSocket);
            });

            expect(mockInitializeMatchmakingSocket).toHaveBeenCalledWith(
                'user123'
            );
        });

        it('should not initialize socket when userId is null', () => {
            mockUseAuth.mockReturnValue({
                userId: null,
                refetch: jest.fn()
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <MatchmakingSocketProvider>
                    {children}
                </MatchmakingSocketProvider>
            );

            const { result } = renderHook(() => useMatchmakingSocket(), {
                wrapper
            });

            expect(result.current.socket).toBe(null);
            expect(mockInitializeMatchmakingSocket).not.toHaveBeenCalled();
        });

        it('should disconnect socket on unmount', async () => {
            mockUseAuth.mockReturnValue({
                userId: 'user123',
                refetch: jest.fn()
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <MatchmakingSocketProvider>
                    {children}
                </MatchmakingSocketProvider>
            );

            const { result, unmount } = renderHook(
                () => useMatchmakingSocket(),
                {
                    wrapper
                }
            );

            await waitFor(() => {
                expect(result.current.socket).toBe(mockSocket);
            });

            unmount();

            expect(mockSocket.disconnect).toHaveBeenCalled();
        });

        it('should handle disconnect error gracefully', async () => {
            const consoleWarnSpy = jest
                .spyOn(console, 'warn')
                .mockImplementation(() => {});

            mockSocket.disconnect = jest.fn(() => {
                throw new Error('Disconnect error');
            });

            mockUseAuth.mockReturnValue({
                userId: 'user123',
                refetch: jest.fn()
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <MatchmakingSocketProvider>
                    {children}
                </MatchmakingSocketProvider>
            );

            const { result, unmount } = renderHook(
                () => useMatchmakingSocket(),
                {
                    wrapper
                }
            );

            await waitFor(() => {
                expect(result.current.socket).toBe(mockSocket);
            });

            unmount();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Socket disconnect error:',
                expect.any(Error)
            );

            consoleWarnSpy.mockRestore();
        });

        it('should not disconnect if socket is already disconnected', async () => {
            mockSocket = {
                id: 'mock-socket-id',
                connected: true,
                disconnected: true,
                disconnect: jest.fn(),
                on: jest.fn(),
                emit: jest.fn(),
                off: jest.fn()
            };
            mockInitializeMatchmakingSocket.mockReturnValue(
                mockSocket as Socket
            );

            mockUseAuth.mockReturnValue({
                userId: 'user123',
                refetch: jest.fn()
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <MatchmakingSocketProvider>
                    {children}
                </MatchmakingSocketProvider>
            );

            const { result, unmount } = renderHook(
                () => useMatchmakingSocket(),
                {
                    wrapper
                }
            );

            await waitFor(() => {
                expect(result.current.socket).toBe(mockSocket);
            });

            unmount();

            expect(mockSocket.disconnect).not.toHaveBeenCalled();
        });
    });

    describe('useMatchmakingSocket hook', () => {
        it('should throw error when used outside MatchmakingSocketProvider', () => {
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            expect(() => {
                renderHook(() => useMatchmakingSocket());
            }).toThrow(
                'useSocket must be used within MatchmakingSocketProvider'
            );

            consoleErrorSpy.mockRestore();
        });
    });
});
