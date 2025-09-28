import CoreRestClient from '../../src/clients/core.rest.client';
import axios from 'axios';
import env from 'chess-game-backend-common/config/env';
import { CreateGameRequest, CreateGameResponse } from '../../src/models/game';
import { Color } from '../../src/models/game';

jest.mock('axios');
jest.mock('chess-game-backend-common/config/env', () => ({
    PORTS: {
        CORE: 3001
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
            const expectedUrl = `http://localhost:${env.PORTS.CORE}/api/game`;
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

            expect(axios.post).toHaveBeenCalledWith(
                expectedUrl,
                expectedRequestBody
            );
            expect(result).toEqual(mockResponse);
        });

        it('should propagate error if axios.post fails', async () => {
            const players = ['user1', 'user2'];
            const expectedUrl = `http://localhost:${env.PORTS.CORE}/api/game`;
            const expectedRequestBody: CreateGameRequest = {
                players: players
            };
            const expectedError = new Error('Network error');

            (axios.post as jest.Mock).mockRejectedValue(expectedError);

            await expect(coreRestClient.createGame(players)).rejects.toThrow(
                expectedError
            );

            expect(axios.post).toHaveBeenCalledWith(
                expectedUrl,
                expectedRequestBody
            );
        });
    });
});
