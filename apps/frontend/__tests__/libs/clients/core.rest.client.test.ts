jest.mock('axios');

import { getGame, getGameHistory } from '@/lib/clients/core.rest.client';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import env from '@/lib/config/env';

jest.mock('@/lib/config/env');

describe('core.rest.client', () => {
    beforeEach(() => {
        env.REST_URLS = {
            CORE: 'http://localhost:8080',
            MATCHMAKING: 'http://localhost:8081',
            AUTH: 'http://localhost:8082'
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getGameHistory', () => {
        it('should call axios.get with correct URL and params and return mapped GameHistory', async () => {
            const userId = 'user123';
            const limit = 10;
            const offset = 0;
            const mockResponse = {
                data: {
                    games: [
                        {
                            gameId: 'game1',
                            whitePlayer: { userId: 'user1', name: 'Player 1', elo: 1500 },
                            blackPlayer: { userId: 'user2', name: 'Player 2', elo: 1600 },
                            startedAt: '2024-01-01T00:00:00Z',
                            winner: 'white'
                        }
                    ],
                    totalCount: 1
                }
            };

            (axios.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await getGameHistory(userId, limit, offset);

            expect(axios.get).toHaveBeenCalledWith('http://localhost:8080/api/games', {
                params: { userId, limit, offset }
            });
            expect(result).toEqual({
                games: [
                    {
                        gameId: 'game1',
                        whitePlayer: { userId: 'user1', name: 'Player 1', elo: 1500 },
                        blackPlayer: { userId: 'user2', name: 'Player 2', elo: 1600 },
                        startedAt: '2024-01-01T00:00:00Z',
                        winner: 'white'
                    }
                ],
                totalCount: 1
            });
        });

        it('should throw error with message from response when AxiosError has response', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: { message: 'User not found' },
                status: 404,
                statusText: 'Not Found',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            await expect(getGameHistory(userId, null, null)).rejects.toThrow('User not found');
        });

        it('should throw default error message when AxiosError has response without message', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: {},
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            await expect(getGameHistory(userId, null, null)).rejects.toThrow('Failed to get game history');
        });

        it('should throw network error when AxiosError has request but no response', async () => {
            const userId = 'user123';
            const axiosError = new AxiosError('Network Error');
            axiosError.request = {};

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            await expect(getGameHistory(userId, null, null)).rejects.toThrow(
                'Network error: Unable to connect to core service'
            );
        });

        it('should throw generic error for non-AxiosError', async () => {
            const userId = 'user123';

            (axios.get as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await expect(getGameHistory(userId, null, null)).rejects.toThrow('Failed to get game history');
        });
    });

    describe('getGame', () => {
        it('should call axios.get with correct URL and return mapped GameWithMoves', async () => {
            const gameId = 'game123';
            const mockResponse = {
                data: {
                    gameId: 'game123',
                    whitePlayer: { userId: 'user1', name: 'Player 1', elo: 1500 },
                    blackPlayer: { userId: 'user2', name: 'Player 2', elo: 1600 },
                    startedAt: '2024-01-01T00:00:00Z',
                    winner: 'white',
                    moves: [
                        {
                            moveNumber: 1,
                            moveNotation: 'e4',
                            whitePlayerTime: 600000,
                            blackPlayerTime: 600000,
                            positionFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                            playerColor: 'white'
                        }
                    ]
                }
            };

            (axios.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await getGame(gameId);

            expect(axios.get).toHaveBeenCalledWith('http://localhost:8080/api/games/game123');
            expect(result).toEqual({
                gameId: 'game123',
                whitePlayer: { userId: 'user1', name: 'Player 1', elo: 1500 },
                blackPlayer: { userId: 'user2', name: 'Player 2', elo: 1600 },
                startedAt: '2024-01-01T00:00:00Z',
                winner: 'white',
                moves: [
                    {
                        moveNumber: 1,
                        moveNotation: 'e4',
                        whitePlayerTime: 600000,
                        blackPlayerTime: 600000,
                        positionFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                        playerColor: 'white'
                    }
                ]
            });
        });

        it('should throw error with message and status from response when AxiosError has response', async () => {
            const gameId = 'game123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: { message: 'Game not found' },
                status: 404,
                statusText: 'Not Found',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            try {
                await getGame(gameId);
                fail('Expected error to be thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Game not found');
                expect((error as Error & { status?: number }).status).toBe(404);
            }
        });

        it('should throw default error message with status when AxiosError has response without message', async () => {
            const gameId = 'game123';
            const axiosError = new AxiosError('Request failed');
            axiosError.response = {
                data: {},
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: {} as InternalAxiosRequestConfig
            };

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            try {
                await getGame(gameId);
                fail('Expected error to be thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Failed to get game');
                expect((error as Error & { status?: number }).status).toBe(500);
            }
        });

        it('should throw network error when AxiosError has request but no response', async () => {
            const gameId = 'game123';
            const axiosError = new AxiosError('Network Error');
            axiosError.request = {};

            (axios.get as jest.Mock).mockRejectedValue(axiosError);

            await expect(getGame(gameId)).rejects.toThrow('Network error: Unable to connect to core service');
        });

        it('should throw generic error for non-AxiosError', async () => {
            const gameId = 'game123';

            (axios.get as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await expect(getGame(gameId)).rejects.toThrow('Failed to get game');
        });
    });
});
