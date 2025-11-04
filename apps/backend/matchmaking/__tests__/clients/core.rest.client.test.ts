import CoreRestClient from '../../src/clients/core.rest.client';
import axios from 'axios';
import env from 'chess-game-backend-common/config/env';
import { Color, CreateGameRequest, CreateGameResponse } from '../../src/models/game';

jest.mock('axios');
jest.mock('chess-game-backend-common/config/env', () => ({
    PORTS: {
        CORE: 3001
    },
    URLS: {
        CORE: 'http://localhost:3001'
    }
}));

describe('Core Rest Client', () => {
    let coreRestClient: CoreRestClient;

    beforeEach(() => {
        coreRestClient = new CoreRestClient();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('createGame', () => {
        it('should call axios.post with correct URL and request body', async () => {
            const players = ['user1', 'user2'];
            const expectedUrl = `${env.URLS.CORE}/internal/games`;
            const expectedRequestBody: CreateGameRequest = {
                players: players
            };
            const mockResponse: CreateGameResponse = {
                gameId: 'game-0000',
                players: [
                    {
                        id: 'user1',
                        color: Color.WHITE,
                        timer: { remainingMs: 600000 }
                    },
                    {
                        id: 'user2',
                        color: Color.BLACK,
                        timer: { remainingMs: 600000 }
                    }
                ]
            };

            (axios.post as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await coreRestClient.createGame(players);

            expect(axios.post).toHaveBeenCalledWith(expectedUrl, expectedRequestBody);
            expect(result).toEqual(mockResponse);
        });

        it('should propagate error if axios.post fails', async () => {
            const players = ['user1', 'user2'];
            const expectedUrl = `${env.URLS.CORE}/internal/games`;
            const expectedRequestBody: CreateGameRequest = {
                players: players
            };
            const expectedError = new Error('Network error');

            (axios.post as jest.Mock).mockRejectedValue(expectedError);

            await expect(coreRestClient.createGame(players)).rejects.toThrow(expectedError);

            expect(axios.post).toHaveBeenCalledWith(expectedUrl, expectedRequestBody);
        });
    });

    describe('checkActiveGame', () => {
        it('should return true when user has an active game', async () => {
            const userId = 'user1';
            const expectedUrl = `${env.URLS.CORE}/internal/games/active`;
            const mockResponse = { data: { gameId: 'game-0000' } };

            (axios.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await coreRestClient.checkActiveGame(userId);

            expect(axios.get).toHaveBeenCalledWith(expectedUrl, {
                params: { userId }
            });
            expect(result).toBe(true);
        });

        it('should return false when axios error with response occurs', async () => {
            const userId = 'user1';
            const expectedUrl = `${env.URLS.CORE}/internal/games/active`;
            const axiosError = {
                isAxiosError: true,
                response: { status: 404, data: { message: 'No active game found' } }
            };

            (axios.get as jest.Mock).mockRejectedValue(axiosError);
            jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

            const result = await coreRestClient.checkActiveGame(userId);

            expect(axios.get).toHaveBeenCalledWith(expectedUrl, {
                params: { userId }
            });
            expect(result).toBe(false);
        });

        it('should propagate error when non-axios error occurs', async () => {
            const userId = 'user1';
            const expectedUrl = `${env.URLS.CORE}/internal/games/active`;
            const expectedError = new Error('Network error');

            (axios.get as jest.Mock).mockRejectedValue(expectedError);
            jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);

            await expect(coreRestClient.checkActiveGame(userId)).rejects.toThrow(expectedError);

            expect(axios.get).toHaveBeenCalledWith(expectedUrl, {
                params: { userId }
            });
        });
    });
});
