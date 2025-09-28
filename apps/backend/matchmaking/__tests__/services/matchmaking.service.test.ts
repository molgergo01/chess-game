import MatchmakingService from '../../src/services/matchmaking.service';
import QueueRepository from '../../src/repositories/queue.repository';
import { SocketIdRepository } from '../../src/repositories/socket.id.repository';
import CoreRestClient from '../../src/clients/core.rest.client';
import MatchmakingNotificationService from '../../src/services/matchmaking.notification.service';
import ConflictError from 'chess-game-backend-common/errors/conlfict.error';
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
        mockQueueRepository =
            new QueueRepository() as jest.Mocked<QueueRepository>;
        mockQueueRepository.isInQueue = jest.fn();
        mockQueueRepository.pushToQueueEnd = jest.fn();
        mockQueueRepository.removeFromQueue = jest.fn();
        mockQueueRepository.getQueueCount = jest.fn();
        mockQueueRepository.popQueue = jest.fn();
        mockQueueRepository.pushToQueueFront = jest.fn();

        mockSocketIdRepository =
            new SocketIdRepository() as jest.Mocked<SocketIdRepository>;
        mockSocketIdRepository.setSocketIdForUser = jest.fn();
        mockSocketIdRepository.getSocketIdForUser = jest.fn();

        mockCoreRestClient =
            new CoreRestClient() as jest.Mocked<CoreRestClient>;
        mockCoreRestClient.createGame = jest.fn();

        mockMatchmakingNotificationService = new MatchmakingNotificationService(
            null as never
        ) as jest.Mocked<MatchmakingNotificationService>;
        mockMatchmakingNotificationService.sendMatchmakeNotification =
            jest.fn();

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

            expect(
                mockSocketIdRepository.setSocketIdForUser
            ).toHaveBeenCalledWith(userId, socketId);
        });
    });

    describe('Join Queue', () => {
        it('should add user to queue if not already in queue', async () => {
            const userId = '1234';
            mockQueueRepository.isInQueue.mockResolvedValue(false);

            await matchmakingService.joinQueue(userId);

            expect(mockQueueRepository.isInQueue).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueueEnd).toHaveBeenCalledWith(
                userId
            );
        });

        it('should throw ConflictError if user is already in queue', async () => {
            const userId = '1234';
            mockQueueRepository.isInQueue.mockResolvedValue(true);

            await expect(matchmakingService.joinQueue(userId)).rejects.toThrow(
                new ConflictError(`User with id ${userId} is already in queue`)
            );

            expect(mockQueueRepository.isInQueue).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.pushToQueueEnd).not.toHaveBeenCalled();
        });
    });

    describe('Leave Queue', () => {
        it('should remove user from queue if in queue', async () => {
            const userId = '1234';
            mockQueueRepository.isInQueue.mockResolvedValue(true);

            await matchmakingService.leaveQueue(userId);

            expect(mockQueueRepository.isInQueue).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.removeFromQueue).toHaveBeenCalledWith(
                userId
            );
        });

        it('should throw NotFoundError if user is not in queue', async () => {
            const userId = '1234';
            mockQueueRepository.isInQueue.mockResolvedValue(false);

            await expect(matchmakingService.leaveQueue(userId)).rejects.toThrow(
                new NotFoundError(`User with id ${userId} is not in queue`)
            );

            expect(mockQueueRepository.isInQueue).toHaveBeenCalledWith(userId);
            expect(mockQueueRepository.removeFromQueue).not.toHaveBeenCalled();
        });
    });

    describe('Check In Queue', () => {
        it('should not throw error if user is in queue', async () => {
            const userId = '1234';
            mockQueueRepository.isInQueue.mockResolvedValue(true);

            await expect(
                matchmakingService.checkInQueue(userId)
            ).resolves.not.toThrow();

            expect(mockQueueRepository.isInQueue).toHaveBeenCalledWith(userId);
        });

        it('should throw NotFoundError if user is not in queue', async () => {
            const userId = '1234';
            mockQueueRepository.isInQueue.mockResolvedValue(false);

            await expect(
                matchmakingService.checkInQueue(userId)
            ).rejects.toThrow(
                new NotFoundError(`User with id ${userId} is not queued`)
            );

            expect(mockQueueRepository.isInQueue).toHaveBeenCalledWith(userId);
        });
    });

    describe('Match Make', () => {
        it('should return early if queue count is less than 2', async () => {
            mockQueueRepository.getQueueCount.mockResolvedValue(1);

            await matchmakingService.matchMake();

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalled();
            expect(mockQueueRepository.popQueue).not.toHaveBeenCalled();
        });

        it('should throw error if popQueue returns null', async () => {
            mockQueueRepository.getQueueCount.mockResolvedValue(2);
            mockQueueRepository.popQueue.mockResolvedValue(null);

            await expect(matchmakingService.matchMake()).rejects.toThrow(
                'Not enough player count'
            );

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalled();
            expect(mockQueueRepository.popQueue).toHaveBeenCalled();
        });

        it('should push players back to front of queue if less than 2 players popped', async () => {
            const players = ['1234'];
            mockQueueRepository.getQueueCount.mockResolvedValue(2);
            mockQueueRepository.popQueue.mockResolvedValue(players);

            await expect(matchmakingService.matchMake()).rejects.toThrow(
                'Not enough player count'
            );

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalled();
            expect(mockQueueRepository.popQueue).toHaveBeenCalled();
            expect(mockQueueRepository.pushToQueueFront).toHaveBeenCalledWith(
                '1234',
                0,
                ['1234']
            );
        });

        it('should create game and send notifications when match is made', async () => {
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

            await matchmakingService.matchMake();

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalled();
            expect(mockQueueRepository.popQueue).toHaveBeenCalled();
            expect(mockCoreRestClient.createGame).toHaveBeenCalledWith(
                playerIds
            );
            expect(
                mockSocketIdRepository.getSocketIdForUser
            ).toHaveBeenCalledWith('1234');
            expect(
                mockSocketIdRepository.getSocketIdForUser
            ).toHaveBeenCalledWith('5678');
            expect(
                mockMatchmakingNotificationService.sendMatchmakeNotification
            ).toHaveBeenCalledWith('socket-1234', [player1, player2], gameId);
            expect(
                mockMatchmakingNotificationService.sendMatchmakeNotification
            ).toHaveBeenCalledWith('socket-5678', [player1, player2], gameId);
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
            mockSocketIdRepository.getSocketIdForUser
                .mockResolvedValueOnce('socket-1234')
                .mockResolvedValueOnce(null);

            await expect(matchmakingService.matchMake()).rejects.toThrow(
                'Socket ids are missing for some players'
            );

            expect(mockQueueRepository.getQueueCount).toHaveBeenCalled();
            expect(mockQueueRepository.popQueue).toHaveBeenCalled();
            expect(mockCoreRestClient.createGame).toHaveBeenCalledWith(
                playerIds
            );
            expect(
                mockMatchmakingNotificationService.sendMatchmakeNotification
            ).not.toHaveBeenCalled();
        });
    });
});
