import { getCurrentUserColor } from '@/lib/utils/game.utils';
import { MatchmakingColor, Player } from '@/lib/models/request/matchmaking';

describe('getCurrentUserColor', () => {
    let localStorageMock: { [key: string]: string };

    beforeEach(() => {
        localStorageMock = {};

        global.Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key] || null);
        global.Storage.prototype.setItem = jest.fn((key: string, value: string) => {
            localStorageMock[key] = value;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('when player color is white', () => {
        it('should return Color.WHITE', () => {
            const userId = 'user123';
            const playerData: Array<Player> = [
                {
                    id: userId,
                    color: 'w',
                    timer: { remainingMs: 600000 }
                },
                {
                    id: 'user456',
                    color: 'b',
                    timer: { remainingMs: 600000 }
                }
            ];
            localStorageMock['playerData'] = JSON.stringify(playerData);

            const result = getCurrentUserColor(userId);

            expect(result).toBe(MatchmakingColor.WHITE);
        });
    });

    describe('when player color is black', () => {
        it('should return Color.BLACK', () => {
            const userId = 'user456';
            const playerData: Array<Player> = [
                {
                    id: 'user123',
                    color: 'w',
                    timer: { remainingMs: 600000 }
                },
                {
                    id: userId,
                    color: 'b',
                    timer: { remainingMs: 600000 }
                }
            ];
            localStorageMock['playerData'] = JSON.stringify(playerData);

            const result = getCurrentUserColor(userId);

            expect(result).toBe(MatchmakingColor.BLACK);
        });
    });

    describe('when playerData is not set', () => {
        it('should throw an error', () => {
            const userId = 'user123';

            expect(() => getCurrentUserColor(userId)).toThrow('playerData not set');
        });
    });

    describe('when playerData length is not 2', () => {
        it('should throw an error when length is 1', () => {
            const userId = 'user123';
            const playerData: Array<Player> = [
                {
                    id: userId,
                    color: 'w',
                    timer: { remainingMs: 600000 }
                }
            ];
            localStorageMock['playerData'] = JSON.stringify(playerData);

            expect(() => getCurrentUserColor(userId)).toThrow('playerData is corrupted');
        });

        it('should throw an error when length is 3', () => {
            const userId = 'user123';
            const playerData: Array<Player> = [
                {
                    id: userId,
                    color: 'w',
                    timer: { remainingMs: 600000 }
                },
                {
                    id: 'user456',
                    color: 'b',
                    timer: { remainingMs: 600000 }
                },
                {
                    id: 'user789',
                    color: 'w',
                    timer: { remainingMs: 600000 }
                }
            ];
            localStorageMock['playerData'] = JSON.stringify(playerData);

            expect(() => getCurrentUserColor(userId)).toThrow('playerData is corrupted');
        });

        it('should throw an error when length is 0', () => {
            const userId = 'user123';
            const playerData: Array<Player> = [];
            localStorageMock['playerData'] = JSON.stringify(playerData);

            expect(() => getCurrentUserColor(userId)).toThrow('playerData is corrupted');
        });
    });

    describe('when player color is invalid', () => {
        it('should throw an error', () => {
            const userId = 'user123';
            const playerData: Array<Player> = [
                {
                    id: userId,
                    color: 'invalid',
                    timer: { remainingMs: 600000 }
                },
                {
                    id: 'user456',
                    color: 'b',
                    timer: { remainingMs: 600000 }
                }
            ];
            localStorageMock['playerData'] = JSON.stringify(playerData);

            expect(() => getCurrentUserColor(userId)).toThrow('Invalid color in playerData');
        });
    });
});
