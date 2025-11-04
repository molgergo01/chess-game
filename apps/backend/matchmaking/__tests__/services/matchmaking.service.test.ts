import MatchmakingService from '../../src/services/matchmaking.service';
import QueueRepository from '../../src/repositories/queue.repository';
import SocketIdRepository from '../../src/repositories/socketId.repository';
import QueuedPlayerRepository from '../../src/repositories/queuedPlayer.repository';
import CoreRestClient from '../../src/clients/core.rest.client';
import MatchmakingNotificationService from '../../src/services/matchmaking.notification.service';
import ConflictError from 'chess-game-backend-common/errors/conflict.error';
import NotFoundError from 'chess-game-backend-common/errors/not.found.error';
import { Color, Player } from '../../src/models/game';
import { matchPlayersByElo } from '../../src/services/helpers/matchmaking.elo.helper';

jest.mock('../../src/repositories/queue.repository');
jest.mock('../../src/repositories/socketId.repository');
jest.mock('../../src/repositories/queuedPlayer.repository');
jest.mock('../../src/clients/core.rest.client');
jest.mock('../../src/services/matchmaking.notification.service');
jest.mock('../../src/services/helpers/matchmaking.elo.helper');

describe('Matchmaking Service', () => {
    let mockQueueRepository: jest.Mocked<QueueRepository>;
    let mockSocketIdRepository: jest.Mocked<SocketIdRepository>;
    let mockQueuedPlayerRepository: jest.Mocked<QueuedPlayerRepository>;
    let mockCoreRestClient: jest.Mocked<CoreRestClient>;
    let mockMatchmakingNotificationService: jest.Mocked<MatchmakingNotificationService>;
    let matchmakingService: MatchmakingService;

    beforeEach(() => {
        mockQueueRepository = new QueueRepository() as jest.Mocked<QueueRepository>;
        mockQueueRepository.pushToQueue = jest.fn();
        mockQueueRepository.removeFromQueue = jest.fn();
        mockQueueRepository.getQueueCount = jest.fn();
        mockQueueRepository.popQueue = jest.fn();

        mockSocketIdRepository = new SocketIdRepository() as jest.Mocked<SocketIdRepository>;
        mockSocketIdRepository.setSocketIdForUser = jest.fn();
        mockSocketIdRepository.getSocketIdForUser = jest.fn();

        mockQueuedPlayerRepository = new QueuedPlayerRepository() as jest.Mocked<QueuedPlayerRepository>;
        mockQueuedPlayerRepository.save = jest.fn();
        mockQueuedPlayerRepository.delete = jest.fn();
        mockQueuedPlayerRepository.getBatch = jest.fn();
        mockQueuedPlayerRepository.getQueueId = jest.fn();

        mockCoreRestClient = new CoreRestClient() as jest.Mocked<CoreRestClient>;
        mockCoreRestClient.createGame = jest.fn();
        mockCoreRestClient.checkActiveGame = jest.fn().mockResolvedValue(false);

        mockMatchmakingNotificationService = new MatchmakingNotificationService(
            null as never
        ) as jest.Mocked<MatchmakingNotificationService>;
        mockMatchmakingNotificationService.sendMatchmakeNotification = jest.fn();

        matchmakingService = new MatchmakingService(
            mockQueueRepository,
            mockSocketIdRepository,
            mockQueuedPlayerRepository,
            mockCoreRestClient,
            mockMatchmakingNotificationService
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('Set Socket Id For User', () => {
        it('should call socketIdRepository.setSocketIdForUser with correct parameters', async () => {
            const userId = '1234';
            const socketId = 'socket-1234';

            await matchmakingService.setSocketIdForUser(userId, socketId);

            expect(mockSocketIdRepository.setSocketIdForUser).toHaveBeenCalledWith(userId, socketId);
        });
    });

    describe('Join Queue', () => {
        it('should add user to queue if not already in queue', async () => {
            const userId = '1234';
            const elo = 1500;
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);
            mockCoreRestClient.checkActiveGame.mockResolvedValue(false);

            await matchmakingService.joinQueue(userId, elo);

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockCoreRestClient.checkActiveGame).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueue).toHaveBeenCalledWith(userId, null, expect.any(Number));
            expect(mockQueuedPlayerRepository.save).toHaveBeenCalledWith(userId, expect.any(Number), elo, null);
        });

        it('should throw ConflictError if user is already in queue', async () => {
            const userId = '1234';
            const elo = 1500;
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue('');

            await expect(matchmakingService.joinQueue(userId, elo)).rejects.toThrow(
                new ConflictError(`User with id ${userId} is already in queue`)
            );

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueue).not.toHaveBeenCalled();
        });

        it('should throw ConflictError if user is already in an active game', async () => {
            const userId = '1234';
            const elo = 1500;
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);
            mockCoreRestClient.checkActiveGame.mockResolvedValue(true);

            await expect(matchmakingService.joinQueue(userId, elo)).rejects.toThrow(
                new ConflictError('User is already in an active game')
            );

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockCoreRestClient.checkActiveGame).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueue).not.toHaveBeenCalled();
        });
    });

    describe('Leave Queue', () => {
        it('should remove user from default queue if in queue', async () => {
            const userId = '1234';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue('');

            await matchmakingService.leaveQueue(userId, null);

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.removeFromQueue).toHaveBeenCalledWith(userId, null);
            expect(mockQueuedPlayerRepository.delete).toHaveBeenCalledWith(userId);
        });

        it('should remove user from private queue if in queue', async () => {
            const userId = '1234';
            const queueId = 'private-queue-123';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(queueId);

            await matchmakingService.leaveQueue(userId, queueId);

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.removeFromQueue).toHaveBeenCalledWith(userId, queueId);
            expect(mockQueuedPlayerRepository.delete).toHaveBeenCalledWith(userId);
        });

        it('should throw NotFoundError if user is not in queue', async () => {
            const userId = '1234';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);

            await expect(matchmakingService.leaveQueue(userId, null)).rejects.toThrow(
                new NotFoundError(`User with id ${userId} is not in queue`)
            );

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.removeFromQueue).not.toHaveBeenCalled();
        });
    });

    describe('Get Queue Status', () => {
        it('should return status with isQueued false and null queueId when user is not in queue', async () => {
            const userId = '1234';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);
            mockCoreRestClient.checkActiveGame.mockResolvedValue(false);

            const result = await matchmakingService.getQueueStatus(userId);

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockCoreRestClient.checkActiveGame).toHaveBeenCalledWith(userId);
            expect(result).toEqual({
                isQueued: false,
                queueId: null,
                hasActiveGame: false
            });
        });

        it('should return status with isQueued true and null queueId when user is in default queue', async () => {
            const userId = '1234';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue('');
            mockCoreRestClient.checkActiveGame.mockResolvedValue(false);

            const result = await matchmakingService.getQueueStatus(userId);

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockCoreRestClient.checkActiveGame).toHaveBeenCalledWith(userId);
            expect(result).toEqual({
                isQueued: true,
                queueId: null,
                hasActiveGame: false
            });
        });

        it('should return status with isQueued true and queueId when user is in private queue', async () => {
            const userId = '1234';
            const queueId = 'private-456';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(queueId);
            mockCoreRestClient.checkActiveGame.mockResolvedValue(false);

            const result = await matchmakingService.getQueueStatus(userId);

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockCoreRestClient.checkActiveGame).toHaveBeenCalledWith(userId);
            expect(result).toEqual({
                isQueued: true,
                queueId: queueId,
                hasActiveGame: false
            });
        });

        it('should return status with hasActiveGame true when user has an active game', async () => {
            const userId = '1234';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);
            mockCoreRestClient.checkActiveGame.mockResolvedValue(true);

            const result = await matchmakingService.getQueueStatus(userId);

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockCoreRestClient.checkActiveGame).toHaveBeenCalledWith(userId);
            expect(result).toEqual({
                isQueued: false,
                queueId: null,
                hasActiveGame: true
            });
        });
    });

    describe('Match Make', () => {
        it('should return early if queue count is less than 2', async () => {
            mockQueueRepository.getQueueCount.mockResolvedValue(1);

            await matchmakingService.matchMake(null);

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(null);
            expect(mockQueueRepository.popQueue).not.toHaveBeenCalled();
        });

        it('should throw error if popQueue returns empty array', async () => {
            mockQueueRepository.getQueueCount.mockResolvedValue(2);
            mockQueueRepository.popQueue.mockResolvedValue([]);

            await expect(matchmakingService.matchMake(null)).rejects.toThrow('Not enough player count');

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(null);
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(null, 2);
        });

        it('should push players back to queue if less than 2 players popped', async () => {
            const players = [{ value: '1234', score: Date.now() }];
            mockQueueRepository.getQueueCount.mockResolvedValue(2);
            mockQueueRepository.popQueue.mockResolvedValue(players);

            await expect(matchmakingService.matchMake(null)).rejects.toThrow('Not enough player count');

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(null);
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(null, 2);
            expect(mockQueueRepository.pushToQueue).toHaveBeenCalledWith('1234', null, players[0].score);
        });

        it('should create game and send notifications when match is made in default queue', async () => {
            const players = [
                { value: '1234', score: Date.now() - 1000 },
                { value: '5678', score: Date.now() }
            ];
            const player1: Player = {
                id: '1234',
                color: Color.WHITE,
                timer: { remainingMs: 600000 }
            };
            const player2: Player = {
                id: '5678',
                color: Color.BLACK,
                timer: { remainingMs: 600000 }
            };
            const gameId = 'game-0000';
            const createGameResponse = {
                players: [player1, player2],
                gameId: gameId
            };
            const queuedPlayers = [
                { playerId: '1234', elo: 1500, queueTimestamp: Date.now() - 1000, queueId: '' },
                { playerId: '5678', elo: 1520, queueTimestamp: Date.now(), queueId: '' }
            ];

            mockQueueRepository.getQueueCount.mockResolvedValue(2);
            mockQueueRepository.popQueue.mockResolvedValue(players);
            mockQueuedPlayerRepository.getBatch.mockResolvedValue(queuedPlayers);
            (matchPlayersByElo as jest.Mock).mockReturnValue([['1234', '5678']]);
            mockCoreRestClient.createGame.mockResolvedValue(createGameResponse);
            mockSocketIdRepository.getSocketIdForUser
                .mockResolvedValueOnce('socket-1234')
                .mockResolvedValueOnce('socket-5678');

            await matchmakingService.matchMake(null);

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(null);
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(null, 2);
            expect(mockQueuedPlayerRepository.getBatch).toHaveBeenCalledWith(['1234', '5678']);
            expect(matchPlayersByElo).toHaveBeenCalledWith(queuedPlayers);
            expect(mockCoreRestClient.createGame).toHaveBeenCalledWith(['1234', '5678']);
            expect(mockSocketIdRepository.getSocketIdForUser).toHaveBeenCalledWith('1234');
            expect(mockSocketIdRepository.getSocketIdForUser).toHaveBeenCalledWith('5678');
            expect(mockMatchmakingNotificationService.sendMatchmakeNotification).toHaveBeenCalledWith('socket-1234');
            expect(mockMatchmakingNotificationService.sendMatchmakeNotification).toHaveBeenCalledWith('socket-5678');
            expect(mockQueuedPlayerRepository.delete).toHaveBeenCalledWith('1234');
            expect(mockQueuedPlayerRepository.delete).toHaveBeenCalledWith('5678');
        });

        it('should create game and send notifications when match is made in private queue', async () => {
            const queueId = 'private-789';
            const players = [
                { value: '1234', score: Date.now() - 1000 },
                { value: '5678', score: Date.now() }
            ];
            const player1: Player = {
                id: '1234',
                color: Color.WHITE,
                timer: { remainingMs: 600000 }
            };
            const player2: Player = {
                id: '5678',
                color: Color.BLACK,
                timer: { remainingMs: 600000 }
            };
            const gameId = 'game-0001';
            const createGameResponse = {
                players: [player1, player2],
                gameId: gameId
            };

            mockQueueRepository.getQueueCount.mockResolvedValue(2);
            mockQueueRepository.popQueue.mockResolvedValue(players);
            mockCoreRestClient.createGame.mockResolvedValue(createGameResponse);
            mockSocketIdRepository.getSocketIdForUser
                .mockResolvedValueOnce('socket-1234')
                .mockResolvedValueOnce('socket-5678');

            await matchmakingService.matchMake(queueId);

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(queueId);
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(queueId, 2);
            expect(mockCoreRestClient.createGame).toHaveBeenCalledWith(['1234', '5678']);
            expect(mockSocketIdRepository.getSocketIdForUser).toHaveBeenCalledWith('1234');
            expect(mockSocketIdRepository.getSocketIdForUser).toHaveBeenCalledWith('5678');
            expect(mockMatchmakingNotificationService.sendMatchmakeNotification).toHaveBeenCalledWith('socket-1234');
            expect(mockMatchmakingNotificationService.sendMatchmakeNotification).toHaveBeenCalledWith('socket-5678');
            expect(mockQueuedPlayerRepository.delete).toHaveBeenCalledWith('1234');
            expect(mockQueuedPlayerRepository.delete).toHaveBeenCalledWith('5678');
        });

        it('should push players back to queue if socket ids are missing', async () => {
            const queueId = 'private-456';
            const players = [
                { value: '1234', score: Date.now() - 1000 },
                { value: '5678', score: Date.now() }
            ];
            const player1: Player = {
                id: '1234',
                color: Color.WHITE,
                timer: { remainingMs: 600000 }
            };
            const player2: Player = {
                id: '5678',
                color: Color.BLACK,
                timer: { remainingMs: 600000 }
            };
            const gameId = 'game-0000';
            const createGameResponse = {
                players: [player1, player2],
                gameId: gameId
            };

            mockQueueRepository.getQueueCount.mockResolvedValue(2);
            mockQueueRepository.popQueue.mockResolvedValue(players);
            mockCoreRestClient.createGame.mockResolvedValue(createGameResponse);
            mockSocketIdRepository.getSocketIdForUser.mockResolvedValueOnce('socket-1234').mockResolvedValueOnce(null);

            await matchmakingService.matchMake(queueId);

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(queueId);
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(queueId, 2);
            expect(mockCoreRestClient.createGame).toHaveBeenCalledWith(['1234', '5678']);
            expect(mockMatchmakingNotificationService.sendMatchmakeNotification).not.toHaveBeenCalled();
            expect(mockQueueRepository.pushToQueue).toHaveBeenCalledWith('1234', queueId, players[0].score);
            expect(mockQueueRepository.pushToQueue).toHaveBeenCalledWith('5678', queueId, players[1].score);
        });
    });

    describe('Create Private Queue', () => {
        it('should generate UUID and create private queue', async () => {
            const userId = '1234';
            const elo = 1500;
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);
            mockCoreRestClient.checkActiveGame.mockResolvedValue(false);
            mockQueueRepository.getQueueCount.mockResolvedValue(0);

            const result = await matchmakingService.createPrivateQueue(userId, elo);

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockCoreRestClient.checkActiveGame).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueue).toHaveBeenCalledWith(userId, result, expect.any(Number));
            expect(mockQueuedPlayerRepository.save).toHaveBeenCalledWith(userId, expect.any(Number), elo, result);
            expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        it('should throw ConflictError if user is already in queue', async () => {
            const userId = '1234';
            const elo = 1500;
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue('existing-queue');

            await expect(matchmakingService.createPrivateQueue(userId, elo)).rejects.toThrow(
                new ConflictError(`User with id ${userId} is already in queue`)
            );

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueue).not.toHaveBeenCalled();
        });

        it('should throw ConflictError if user is already in an active game', async () => {
            const userId = '1234';
            const elo = 1500;
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);
            mockCoreRestClient.checkActiveGame.mockResolvedValue(true);

            await expect(matchmakingService.createPrivateQueue(userId, elo)).rejects.toThrow(
                new ConflictError('User is already in an active game')
            );

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockCoreRestClient.checkActiveGame).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueue).not.toHaveBeenCalled();
        });
    });

    describe('Join Private Queue', () => {
        it('should add user to private queue when queue has 1 player', async () => {
            const userId = '1234';
            const elo = 1500;
            const queueId = 'private-456';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);
            mockCoreRestClient.checkActiveGame.mockResolvedValue(false);
            mockQueueRepository.getQueueCount.mockResolvedValue(1);

            await matchmakingService.joinPrivateQueue(userId, elo, queueId);

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockCoreRestClient.checkActiveGame).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(queueId);
            expect(mockQueueRepository.pushToQueue).toHaveBeenCalledWith(userId, queueId, expect.any(Number));
            expect(mockQueuedPlayerRepository.save).toHaveBeenCalledWith(userId, expect.any(Number), elo, null);
        });

        it('should trigger matchMake when 2nd player joins', async () => {
            const userId = '5678';
            const elo = 1500;
            const queueId = 'private-789';
            const players = [
                { value: '1234', score: Date.now() - 1000 },
                { value: '5678', score: Date.now() }
            ];
            const player1: Player = {
                id: '1234',
                color: Color.WHITE,
                timer: { remainingMs: 600000 }
            };
            const player2: Player = {
                id: '5678',
                color: Color.BLACK,
                timer: { remainingMs: 600000 }
            };
            const gameId = 'game-0002';
            const createGameResponse = {
                players: [player1, player2],
                gameId: gameId
            };

            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);
            mockCoreRestClient.checkActiveGame.mockResolvedValue(false);
            mockQueueRepository.getQueueCount.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
            mockQueueRepository.popQueue.mockResolvedValue(players);
            mockCoreRestClient.createGame.mockResolvedValue(createGameResponse);
            mockSocketIdRepository.getSocketIdForUser
                .mockResolvedValueOnce('socket-1234')
                .mockResolvedValueOnce('socket-5678');

            await matchmakingService.joinPrivateQueue(userId, elo, queueId);

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockCoreRestClient.checkActiveGame).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(queueId);
            expect(mockQueueRepository.pushToQueue).toHaveBeenCalledWith(userId, queueId, expect.any(Number));
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(queueId, 2);
            expect(mockCoreRestClient.createGame).toHaveBeenCalledWith(['1234', '5678']);
        });

        it('should throw ConflictError if user is already in queue', async () => {
            const userId = '1234';
            const elo = 1500;
            const queueId = 'private-456';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue('another-queue');

            await expect(matchmakingService.joinPrivateQueue(userId, elo, queueId)).rejects.toThrow(
                new ConflictError(`User with id ${userId} is already in queue`)
            );

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueue).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError if private queue does not exist', async () => {
            const userId = '1234';
            const elo = 1500;
            const queueId = 'non-existent';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);
            mockQueueRepository.getQueueCount.mockResolvedValue(0);

            await expect(matchmakingService.joinPrivateQueue(userId, elo, queueId)).rejects.toThrow(
                new NotFoundError(`Private queue with id ${queueId} not found`)
            );

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(queueId);
            expect(mockQueueRepository.pushToQueue).not.toHaveBeenCalled();
        });

        it('should throw ConflictError if private queue is full', async () => {
            const userId = '1234';
            const elo = 1500;
            const queueId = 'full-queue';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);
            mockQueueRepository.getQueueCount.mockResolvedValue(2);

            await expect(matchmakingService.joinPrivateQueue(userId, elo, queueId)).rejects.toThrow(
                new ConflictError(`Private queue with id ${queueId} is full`)
            );

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(queueId);
            expect(mockQueueRepository.pushToQueue).not.toHaveBeenCalled();
        });

        it('should throw ConflictError if user is already in an active game', async () => {
            const userId = '1234';
            const elo = 1500;
            const queueId = 'private-456';
            mockQueuedPlayerRepository.getQueueId.mockResolvedValue(null);
            mockCoreRestClient.checkActiveGame.mockResolvedValue(true);

            await expect(matchmakingService.joinPrivateQueue(userId, elo, queueId)).rejects.toThrow(
                new ConflictError('User is already in an active game')
            );

            expect(mockQueuedPlayerRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockCoreRestClient.checkActiveGame).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueue).not.toHaveBeenCalled();
        });
    });
});
