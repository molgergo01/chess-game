import { matchPlayersByElo } from '../../../src/services/helpers/matchmaking.elo.helper';
import { QueuedPlayer } from '../../../src/models/matchmaking';

describe('Matchmaking ELO Helper', () => {
    let dateNowSpy: jest.SpyInstance;
    const NOW = 1000000;

    beforeEach(() => {
        dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW);
    });

    afterEach(() => {
        dateNowSpy.mockRestore();
    });

    describe('matchPlayersByElo', () => {
        describe('empty and minimal inputs', () => {
            it('should return empty array when no players provided', () => {
                const result = matchPlayersByElo([]);
                expect(result).toEqual([]);
            });

            it('should return empty array when only one player', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([]);
            });
        });

        describe('basic matching', () => {
            it('should match two players with similar ELO just joined queue', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1520, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should match two players with identical ELO', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should not match players outside initial range', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1600, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([]);
            });

            it('should match players at exact boundary of initial range', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1550, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });
        });

        describe('ELO range expansion over time', () => {
            it('should expand range to ±100 after 10 seconds', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW - 10000, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1590, queueTimestamp: NOW - 10000, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should expand range to ±200 after 20 seconds', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW - 20000, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1690, queueTimestamp: NOW - 20000, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should expand range to ±400 after 40 seconds', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW - 40000, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1890, queueTimestamp: NOW - 40000, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should expand range to ±600 after 80 seconds', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW - 80000, queueId: 'queue1' },
                    { playerId: 'player2', elo: 2090, queueTimestamp: NOW - 80000, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should expand range to ±800 after 160 seconds', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW - 160000, queueId: 'queue1' },
                    { playerId: 'player2', elo: 2290, queueTimestamp: NOW - 160000, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should cap range at ±800 after long wait times', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW - 300000, queueId: 'queue1' },
                    { playerId: 'player2', elo: 2290, queueTimestamp: NOW - 300000, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should match players with different wait times based on their individual ranges', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1540, queueTimestamp: NOW - 20000, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should not match when only one player range expanded enough', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1600, queueTimestamp: NOW - 20000, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([]);
            });
        });

        describe('multiple players', () => {
            it('should match multiple pairs when available', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1520, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player3', elo: 1800, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player4', elo: 1830, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toHaveLength(2);
                expect(result).toContainEqual(['player1', 'player2']);
                expect(result).toContainEqual(['player3', 'player4']);
            });

            it('should leave odd player unmatched', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1520, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player3', elo: 1510, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toHaveLength(1);
            });

            it('should not create duplicate matches', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1510, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player3', elo: 1520, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toHaveLength(1);

                const allPlayerIds = result.flat();
                const uniquePlayerIds = new Set(allPlayerIds);
                expect(allPlayerIds).toHaveLength(uniquePlayerIds.size);
            });
        });

        describe('sorting priority', () => {
            it('should prioritize smaller ELO differences', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1540, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player3', elo: 1510, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player3']]);
            });

            it('should prioritize longer wait time when ELO differences are equal', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW - 5000, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1510, queueTimestamp: NOW - 10000, queueId: 'queue1' },
                    { playerId: 'player3', elo: 1510, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player2', 'player3']]);
            });

            it('should use max wait time of both players for tie-breaking', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW - 5000, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1510, queueTimestamp: NOW - 15000, queueId: 'queue1' },
                    { playerId: 'player3', elo: 1510, queueTimestamp: NOW - 10000, queueId: 'queue1' },
                    { playerId: 'player4', elo: 1500, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toHaveLength(2);
                expect(result).toContainEqual(['player2', 'player3']);
                expect(result).toContainEqual(['player1', 'player4']);
            });
        });

        describe('edge cases', () => {
            it('should handle very low ELO values', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 100, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 120, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should handle very high ELO values', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 3000, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: 3040, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should handle maximum ELO difference at cap', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1000, queueTimestamp: NOW - 200000, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1800, queueTimestamp: NOW - 200000, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should not match beyond maximum ELO difference', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1000, queueTimestamp: NOW - 200000, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1810, queueTimestamp: NOW - 200000, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([]);
            });

            it('should handle negative ELO values', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: -100, queueTimestamp: NOW, queueId: 'queue1' },
                    { playerId: 'player2', elo: -80, queueTimestamp: NOW, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toEqual([['player1', 'player2']]);
            });

            it('should handle complex scenario with multiple potential matches', () => {
                const players: QueuedPlayer[] = [
                    { playerId: 'player1', elo: 1500, queueTimestamp: NOW - 30000, queueId: 'queue1' },
                    { playerId: 'player2', elo: 1550, queueTimestamp: NOW - 25000, queueId: 'queue1' },
                    { playerId: 'player3', elo: 1600, queueTimestamp: NOW - 35000, queueId: 'queue1' },
                    { playerId: 'player4', elo: 1650, queueTimestamp: NOW - 15000, queueId: 'queue1' },
                    { playerId: 'player5', elo: 1700, queueTimestamp: NOW - 10000, queueId: 'queue1' },
                    { playerId: 'player6', elo: 1750, queueTimestamp: NOW - 5000, queueId: 'queue1' }
                ];

                const result = matchPlayersByElo(players);
                expect(result).toContainEqual(['player2', 'player3']);
                expect(result).toContainEqual(['player4', 'player5']);
            });
        });
    });
});
