jest.mock('@/lib/sockets/core.socket');
jest.mock('@/hooks/auth/useAuth');

import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { CoreSocketProvider, useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { initializeCoreSocket } from '@/lib/sockets/core.socket';
import { useAuth } from '@/hooks/auth/useAuth';
import { Socket } from 'socket.io-client';

describe('useCoreSocket', () => {
    const mockInitializeCoreSocket =
        initializeCoreSocket as jest.MockedFunction<
            typeof initializeCoreSocket
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

        mockInitializeCoreSocket.mockReturnValue(mockSocket as Socket);
        jest.clearAllMocks();
    });

    describe('CoreSocketProvider', () => {
        it('should initialize socket when userId is available', async () => {
            mockUseAuth.mockReturnValue({
                userId: 'user123',
                refetch: jest.fn()
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <CoreSocketProvider>{children}</CoreSocketProvider>
            );

            const { result } = renderHook(() => useCoreSocket(), { wrapper });

            await waitFor(() => {
                expect(result.current.socket).toBe(mockSocket);
            });

            expect(mockInitializeCoreSocket).toHaveBeenCalledWith('user123');
        });

        it('should not initialize socket when userId is null', () => {
            mockUseAuth.mockReturnValue({
                userId: null,
                refetch: jest.fn()
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <CoreSocketProvider>{children}</CoreSocketProvider>
            );

            const { result } = renderHook(() => useCoreSocket(), { wrapper });

            expect(result.current.socket).toBe(null);
            expect(mockInitializeCoreSocket).not.toHaveBeenCalled();
        });

        it('should disconnect socket on unmount', async () => {
            mockUseAuth.mockReturnValue({
                userId: 'user123',
                refetch: jest.fn()
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <CoreSocketProvider>{children}</CoreSocketProvider>
            );

            const { result, unmount } = renderHook(() => useCoreSocket(), {
                wrapper
            });

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
                <CoreSocketProvider>{children}</CoreSocketProvider>
            );

            const { result, unmount } = renderHook(() => useCoreSocket(), {
                wrapper
            });

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
            mockInitializeCoreSocket.mockReturnValue(mockSocket as Socket);

            mockUseAuth.mockReturnValue({
                userId: 'user123',
                refetch: jest.fn()
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
                <CoreSocketProvider>{children}</CoreSocketProvider>
            );

            const { result, unmount } = renderHook(() => useCoreSocket(), {
                wrapper
            });

            await waitFor(() => {
                expect(result.current.socket).toBe(mockSocket);
            });

            unmount();

            expect(mockSocket.disconnect).not.toHaveBeenCalled();
        });
    });

    describe('useCoreSocket hook', () => {
        it('should throw error when used outside CoreSocketProvider', () => {
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            expect(() => {
                renderHook(() => useCoreSocket());
            }).toThrow('useSocket must be used within CoreSocketProvider');

            consoleErrorSpy.mockRestore();
        });
    });
});
