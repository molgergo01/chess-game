import MatchmakingService from '../../src/services/matchmaking.service';
import QueueRepository from '../../src/repositories/queue.repository';
import { SocketIdRepository } from '../../src/repositories/socket.id.repository';
import CoreRestClient from '../../src/clients/core.rest.client';
import MatchmakingNotificationService from '../../src/services/matchmaking.notification.service';
import ConflictError from 'chess-game-backend-common/errors/conflict.error';
import NotFoundError from 'chess-game-backend-common/errors/not.found.error';
import { Color, Player } from '../../src/models/game';

jest.mock('../../src/repositories/queue.repository');
jest.mock('../../src/repositories/socket.id.repository');
jest.mock('../../src/clients/core.rest.client');
jest.mock('../../src/services/matchmaking.notification.service');

describe('Matchmaking Service', () => {
    let mockQueueRepository: jest.Mocked<QueueRepository>;
    let mockSocketIdRepository: jest.Mocked<SocketIdRepository>;
    let mockCoreRestClient: jest.Mocked<CoreRestClient>;
    let mockMatchmakingNotificationService: jest.Mocked<MatchmakingNotificationService>;
    let matchmakingService: MatchmakingService;

    beforeEach(() => {
        mockQueueRepository = new QueueRepository() as jest.Mocked<QueueRepository>;
        mockQueueRepository.getQueueId = jest.fn();
        mockQueueRepository.pushToQueueEnd = jest.fn();
        mockQueueRepository.removeFromQueue = jest.fn();
        mockQueueRepository.getQueueCount = jest.fn();
        mockQueueRepository.popQueue = jest.fn();
        mockQueueRepository.pushToQueueFront = jest.fn();

        mockSocketIdRepository = new SocketIdRepository() as jest.Mocked<SocketIdRepository>;
        mockSocketIdRepository.setSocketIdForUser = jest.fn();
        mockSocketIdRepository.getSocketIdForUser = jest.fn();

        mockCoreRestClient = new CoreRestClient() as jest.Mocked<CoreRestClient>;
        mockCoreRestClient.createGame = jest.fn();

        mockMatchmakingNotificationService = new MatchmakingNotificationService(
            null as never
        ) as jest.Mocked<MatchmakingNotificationService>;
        mockMatchmakingNotificationService.sendMatchmakeNotification = jest.fn();

        matchmakingService = new MatchmakingService(
            mockQueueRepository,
            mockSocketIdRepository,
            mockCoreRestClient,
            mockMatchmakingNotificationService
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('Set Socket Id For User', () => {
        it('should call socketIdRepository.setSocketIdForUser with correct parameters', () => {
            const userId = '1234';
            const socketId = 'socket-1234';

            matchmakingService.setSocketIdForUser(userId, socketId);

            expect(mockSocketIdRepository.setSocketIdForUser).toHaveBeenCalledWith(userId, socketId);
        });
    });

    describe('Join Queue', () => {
        it('should add user to queue if not already in queue', async () => {
            const userId = '1234';
            mockQueueRepository.getQueueId.mockResolvedValue(null);

            await matchmakingService.joinQueue(userId);

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueueEnd).toHaveBeenCalledWith(userId, null);
        });

        it('should throw ConflictError if user is already in queue', async () => {
            const userId = '1234';
            mockQueueRepository.getQueueId.mockResolvedValue('');

            await expect(matchmakingService.joinQueue(userId)).rejects.toThrow(
                new ConflictError(`User with id ${userId} is already in queue`)
            );

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueueEnd).not.toHaveBeenCalled();
        });
    });

    describe('Leave Queue', () => {
        it('should remove user from default queue if in queue', async () => {
            const userId = '1234';
            mockQueueRepository.getQueueId.mockResolvedValue('');

            await matchmakingService.leaveQueue(userId, null);

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.removeFromQueue).toHaveBeenCalledWith(userId, null);
        });

        it('should remove user from private queue if in queue', async () => {
            const userId = '1234';
            const queueId = 'private-queue-123';
            mockQueueRepository.getQueueId.mockResolvedValue(queueId);

            await matchmakingService.leaveQueue(userId, queueId);

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.removeFromQueue).toHaveBeenCalledWith(userId, queueId);
        });

        it('should throw NotFoundError if user is not in queue', async () => {
            const userId = '1234';
            mockQueueRepository.getQueueId.mockResolvedValue(null);

            await expect(matchmakingService.leaveQueue(userId, null)).rejects.toThrow(
                new NotFoundError(`User with id ${userId} is not in queue`)
            );

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.removeFromQueue).not.toHaveBeenCalled();
        });
    });

    describe('Get Queue', () => {
        it('should return empty string if user is in default queue', async () => {
            const userId = '1234';
            mockQueueRepository.getQueueId.mockResolvedValue('');

            const result = await matchmakingService.getQueue(userId);

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(result).toBe('');
        });

        it('should return queueId if user is in private queue', async () => {
            const userId = '1234';
            const queueId = 'private-456';
            mockQueueRepository.getQueueId.mockResolvedValue(queueId);

            const result = await matchmakingService.getQueue(userId);

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(result).toBe(queueId);
        });

        it('should throw NotFoundError if user is not in queue', async () => {
            const userId = '1234';
            mockQueueRepository.getQueueId.mockResolvedValue(null);

            await expect(matchmakingService.getQueue(userId)).rejects.toThrow(
                new NotFoundError(`User with id ${userId} is not queued`)
            );

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
        });
    });

    describe('Match Make', () => {
        it('should return early if queue count is less than 2', async () => {
            mockQueueRepository.getQueueCount.mockResolvedValue(1);

            await matchmakingService.matchMake(null);

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(null);
            expect(mockQueueRepository.popQueue).not.toHaveBeenCalled();
        });

        it('should throw error if popQueue returns null', async () => {
            mockQueueRepository.getQueueCount.mockResolvedValue(2);
            mockQueueRepository.popQueue.mockResolvedValue(null);

            await expect(matchmakingService.matchMake(null)).rejects.toThrow('Not enough player count');

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(null);
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(null);
        });

        it('should push players back to front of queue if less than 2 players popped', async () => {
            const players = ['1234'];
            mockQueueRepository.getQueueCount.mockResolvedValue(2);
            mockQueueRepository.popQueue.mockResolvedValue(players);

            await expect(matchmakingService.matchMake(null)).rejects.toThrow('Not enough player count');

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(null);
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(null);
            expect(mockQueueRepository.pushToQueueFront).toHaveBeenCalledWith('1234', null);
        });

        it('should create game and send notifications when match is made in default queue', async () => {
            const playerIds = ['1234', '5678'];
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
            mockQueueRepository.popQueue.mockResolvedValue(playerIds);
            mockCoreRestClient.createGame.mockResolvedValue(createGameResponse);
            mockSocketIdRepository.getSocketIdForUser
                .mockResolvedValueOnce('socket-1234')
                .mockResolvedValueOnce('socket-5678');

            await matchmakingService.matchMake(null);

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(null);
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(null);
            expect(mockCoreRestClient.createGame).toHaveBeenCalledWith(playerIds);
            expect(mockSocketIdRepository.getSocketIdForUser).toHaveBeenCalledWith('1234');
            expect(mockSocketIdRepository.getSocketIdForUser).toHaveBeenCalledWith('5678');
            expect(mockMatchmakingNotificationService.sendMatchmakeNotification).toHaveBeenCalledWith(
                'socket-1234',
                [player1, player2],
                gameId
            );
            expect(mockMatchmakingNotificationService.sendMatchmakeNotification).toHaveBeenCalledWith(
                'socket-5678',
                [player1, player2],
                gameId
            );
        });

        it('should create game and send notifications when match is made in private queue', async () => {
            const queueId = 'private-789';
            const playerIds = ['1234', '5678'];
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
            mockQueueRepository.popQueue.mockResolvedValue(playerIds);
            mockCoreRestClient.createGame.mockResolvedValue(createGameResponse);
            mockSocketIdRepository.getSocketIdForUser
                .mockResolvedValueOnce('socket-1234')
                .mockResolvedValueOnce('socket-5678');

            await matchmakingService.matchMake(queueId);

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(queueId);
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(queueId);
            expect(mockCoreRestClient.createGame).toHaveBeenCalledWith(playerIds);
            expect(mockSocketIdRepository.getSocketIdForUser).toHaveBeenCalledWith('1234');
            expect(mockSocketIdRepository.getSocketIdForUser).toHaveBeenCalledWith('5678');
            expect(mockMatchmakingNotificationService.sendMatchmakeNotification).toHaveBeenCalledWith(
                'socket-1234',
                [player1, player2],
                gameId
            );
            expect(mockMatchmakingNotificationService.sendMatchmakeNotification).toHaveBeenCalledWith(
                'socket-5678',
                [player1, player2],
                gameId
            );
        });

        it('should throw error if socket ids are missing for some players', async () => {
            const playerIds = ['1234', '5678'];
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
            mockQueueRepository.popQueue.mockResolvedValue(playerIds);
            mockCoreRestClient.createGame.mockResolvedValue(createGameResponse);
            mockSocketIdRepository.getSocketIdForUser.mockResolvedValueOnce('socket-1234').mockResolvedValueOnce(null);

            await expect(matchmakingService.matchMake(null)).rejects.toThrow('Socket ids are missing for some players');

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(null);
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(null);
            expect(mockCoreRestClient.createGame).toHaveBeenCalledWith(playerIds);
            expect(mockMatchmakingNotificationService.sendMatchmakeNotification).not.toHaveBeenCalled();
        });
    });

    describe('Create Private Queue', () => {
        it('should generate UUID and create private queue', async () => {
            const userId = '1234';
            mockQueueRepository.getQueueId.mockResolvedValue(null);
            mockQueueRepository.getQueueCount.mockResolvedValue(0);

            const result = await matchmakingService.createPrivateQueue(userId);

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueueEnd).toHaveBeenCalledWith(userId, result);
            expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        it('should throw ConflictError if user is already in queue', async () => {
            const userId = '1234';
            mockQueueRepository.getQueueId.mockResolvedValue('existing-queue');

            await expect(matchmakingService.createPrivateQueue(userId)).rejects.toThrow(
                new ConflictError(`User with id ${userId} is already in queue`)
            );

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueueEnd).not.toHaveBeenCalled();
        });
    });

    describe('Join Private Queue', () => {
        it('should add user to private queue when queue has 1 player', async () => {
            const userId = '1234';
            const queueId = 'private-456';
            mockQueueRepository.getQueueId.mockResolvedValue(null);
            mockQueueRepository.getQueueCount.mockResolvedValue(1);

            await matchmakingService.joinPrivateQueue(userId, queueId);

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(queueId);
            expect(mockQueueRepository.pushToQueueEnd).toHaveBeenCalledWith(userId, queueId);
        });

        it('should trigger matchMake when 2nd player joins', async () => {
            const userId = '5678';
            const queueId = 'private-789';
            const playerIds = ['1234', '5678'];
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

            mockQueueRepository.getQueueId.mockResolvedValue(null);
            mockQueueRepository.getQueueCount.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
            mockQueueRepository.popQueue.mockResolvedValue(playerIds);
            mockCoreRestClient.createGame.mockResolvedValue(createGameResponse);
            mockSocketIdRepository.getSocketIdForUser
                .mockResolvedValueOnce('socket-1234')
                .mockResolvedValueOnce('socket-5678');

            await matchmakingService.joinPrivateQueue(userId, queueId);

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(queueId);
            expect(mockQueueRepository.pushToQueueEnd).toHaveBeenCalledWith(userId, queueId);
            expect(mockQueueRepository.popQueue).toHaveBeenCalledWith(queueId);
            expect(mockCoreRestClient.createGame).toHaveBeenCalledWith(playerIds);
        });

        it('should throw ConflictError if user is already in queue', async () => {
            const userId = '1234';
            const queueId = 'private-456';
            mockQueueRepository.getQueueId.mockResolvedValue('another-queue');

            await expect(matchmakingService.joinPrivateQueue(userId, queueId)).rejects.toThrow(
                new ConflictError(`User with id ${userId} is already in queue`)
            );

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueueEnd).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError if private queue does not exist', async () => {
            const userId = '1234';
            const queueId = 'non-existent';
            mockQueueRepository.getQueueId.mockResolvedValue(null);
            mockQueueRepository.getQueueCount.mockResolvedValue(0);

            await expect(matchmakingService.joinPrivateQueue(userId, queueId)).rejects.toThrow(
                new NotFoundError(`Private queue with id ${queueId} not found`)
            );

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(queueId);
            expect(mockQueueRepository.pushToQueueEnd).not.toHaveBeenCalled();
        });

        it('should throw ConflictError if private queue is full', async () => {
            const userId = '1234';
            const queueId = 'full-queue';
            mockQueueRepository.getQueueId.mockResolvedValue(null);
            mockQueueRepository.getQueueCount.mockResolvedValue(2);

            await expect(matchmakingService.joinPrivateQueue(userId, queueId)).rejects.toThrow(
                new ConflictError(`Private queue with id ${queueId} is full`)
            );

            expect(mockQueueRepository.getQueueId).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.getQueueCount).toHaveBeenCalledWith(queueId);
            expect(mockQueueRepository.pushToQueueEnd).not.toHaveBeenCalled();
        });
    });
});
