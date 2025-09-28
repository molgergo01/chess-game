jest.mock('@/lib/clients/auth.rest.client');

import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AuthProvider, useAuth } from '@/hooks/auth/useAuth';
import { getUser } from '@/lib/clients/auth.rest.client';

describe('useAuth', () => {
    const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;

    const createMockAxiosResponse = <T,>(
        data: T,
        status: number = 200
    ): AxiosResponse<T> => ({
        data,
        status,
        statusText: status === 200 ? 'OK' : 'Unauthorized',
        headers: {},
        config: {
            headers: {}
        } as InternalAxiosRequestConfig
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('AuthProvider', () => {
        it('should fetch user data on mount', async () => {
            const mockResponse = createMockAxiosResponse(
                { id: 'user123', name: 'Test User' },
                200
            );
            mockGetUser.mockResolvedValue(mockResponse);

            const wrapper = ({ children }: { children: ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.userId).toBe('user123');
            });

            expect(mockGetUser).toHaveBeenCalledTimes(1);
        });

        it('should set userId to null when response status is not 200', async () => {
            const mockResponse = createMockAxiosResponse(null, 401);
            mockGetUser.mockResolvedValue(mockResponse);

            const wrapper = ({ children }: { children: ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.userId).toBe(null);
            });
        });

        it('should handle errors when fetching user data', async () => {
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});
            mockGetUser.mockRejectedValue(new Error('Network error'));

            const wrapper = ({ children }: { children: ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.userId).toBe(null);
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to fetch user data:',
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it('should refetch user data when refetch is called', async () => {
            const mockResponse1 = createMockAxiosResponse(
                { id: 'user123', name: 'Test User' },
                200
            );
            const mockResponse2 = createMockAxiosResponse(
                { id: 'user456', name: 'Updated User' },
                200
            );

            mockGetUser
                .mockResolvedValueOnce(mockResponse1)
                .mockResolvedValueOnce(mockResponse2);

            const wrapper = ({ children }: { children: ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.userId).toBe('user123');
            });

            await result.current.refetch();

            await waitFor(() => {
                expect(result.current.userId).toBe('user456');
            });

            expect(mockGetUser).toHaveBeenCalledTimes(2);
        });
    });

    describe('useAuth hook', () => {
        it('should throw error when used outside AuthProvider', () => {
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            expect(() => {
                renderHook(() => useAuth());
            }).toThrow('useAuth must be used within AuthProvider');

            consoleErrorSpy.mockRestore();
        });
    });
});
