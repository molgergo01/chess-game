import { AuthUser } from '@/lib/models/response/auth';
import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/hooks/auth/useAuth';
import { getUser } from '@/lib/clients/auth.rest.client';

jest.mock('@/lib/clients/auth.rest.client');

describe('useAuth', () => {
    const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('AuthProvider', () => {
        it('should fetch user data on mount', async () => {
            const authUser: AuthUser = {
                id: 'user123',
                name: 'Test User',
                email: 'test@user.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            };
            mockGetUser.mockResolvedValue(authUser);

            const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.userId).toBe('user123');
            });

            expect(mockGetUser).toHaveBeenCalledTimes(1);
        });

        it('should set userId to null when get user throws', async () => {
            mockGetUser.mockRejectedValue(new Error());

            const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.userId).toBe(null);
            });
        });

        it('should handle errors when fetching user data', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockGetUser.mockRejectedValue(new Error('Network error'));

            const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.userId).toBe(null);
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch user data:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });

        it('should refetch user data when refetch is called', async () => {
            const authUser: AuthUser = {
                id: 'user123',
                name: 'Test User',
                email: 'test@user.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            };

            const updatedUser: AuthUser = {
                id: 'user456',
                name: 'Updated User',
                email: 'test@user.com',
                elo: 1500,
                avatarUrl: 'avatar.jpg'
            };

            mockGetUser.mockResolvedValueOnce(authUser).mockResolvedValueOnce(updatedUser);

            const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

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
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                renderHook(() => useAuth());
            }).toThrow('useAuth must be used within AuthProvider');

            consoleErrorSpy.mockRestore();
        });
    });
});
