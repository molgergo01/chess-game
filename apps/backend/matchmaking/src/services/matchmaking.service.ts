import { inject, injectable } from 'inversify';
import QueueRepository from '../repositories/queue.repository';
import SocketIdRepository from '../repositories/socketId.repository';
import CoreRestClient from '../clients/core.rest.client';
import ConflictError from 'chess-game-backend-common/errors/conflict.error';
import NotFoundError from 'chess-game-backend-common/errors/not.found.error';
import MatchmakingNotificationService from './matchmaking.notification.service';
import { v4 as uuidv4 } from 'uuid';
import QueuedPlayerRepository from '../repositories/queuedPlayer.repository';
import { matchPlayersByElo } from './helpers/matchmaking.elo.helper';

@injectable()
class MatchmakingService {
    constructor(
        @inject(QueueRepository)
        public readonly queueRepository: QueueRepository,
        @inject(SocketIdRepository)
        public readonly socketIdRepository: SocketIdRepository,
        @inject(QueuedPlayerRepository)
        public readonly queuedPlayerRepository: QueuedPlayerRepository,
        @inject(CoreRestClient)
        private readonly coreRestClient: CoreRestClient,
        @inject(MatchmakingNotificationService)
        private readonly matchmakingNotificationService: MatchmakingNotificationService
    ) {}

    async setSocketIdForUser(userId: string, socketId: string) {
        return this.socketIdRepository.setSocketIdForUser(userId, socketId);
    }

    async joinQueue(userId: string) {
        if ((await this.queuedPlayerRepository.getQueueId(userId)) !== null) {
            throw new ConflictError(`User with id ${userId} is already in queue`);
        }
        if (await this.coreRestClient.checkActiveGame(userId)) {
            throw new ConflictError('User is already in an active game');
        }
        const queueTimeStamp = Date.now();
        this.queueRepository.pushToQueue(userId, null, queueTimeStamp);
        this.queuedPlayerRepository.save(userId, queueTimeStamp, 400, null); // TODO ACtual elo
    }

    async createPrivateQueue(userId: string): Promise<string> {
        if ((await this.queuedPlayerRepository.getQueueId(userId)) !== null) {
            throw new ConflictError(`User with id ${userId} is already in queue`);
        }
        if (await this.coreRestClient.checkActiveGame(userId)) {
            throw new ConflictError('User is already in an active game');
        }

        const queueId = uuidv4();

        const queueTimeStamp = Date.now();
        this.queueRepository.pushToQueue(userId, queueId, Date.now());
        this.queuedPlayerRepository.save(userId, queueTimeStamp, 400, queueId); // TODO actual elo
        return queueId;
    }

    async joinPrivateQueue(userId: string, queueId: string) {
        if ((await this.queuedPlayerRepository.getQueueId(userId)) !== null) {
            throw new ConflictError(`User with id ${userId} is already in queue`);
        }
        if (await this.coreRestClient.checkActiveGame(userId)) {
            throw new ConflictError('User is already in an active game');
        }
        const queueCount = await this.queueRepository.getQueueCount(queueId);
        if (queueCount === 0) {
            throw new NotFoundError(`Private queue with id ${queueId} not found`);
        }
        if (queueCount >= 2) {
            throw new ConflictError(`Private queue with id ${queueId} is full`);
        }

        const queueTimeStamp = Date.now();
        this.queueRepository.pushToQueue(userId, queueId, Date.now());
        this.queuedPlayerRepository.save(userId, queueTimeStamp, 400, null); // TODO actual elo
        if (queueCount == 1) {
            await this.matchMake(queueId);
        }
    }

    async leaveQueue(userId: string, queueId: string | null) {
        if ((await this.queuedPlayerRepository.getQueueId(userId)) === null) {
            throw new NotFoundError(`User with id ${userId} is not in queue`);
        }
        this.queueRepository.removeFromQueue(userId, queueId);
        this.queuedPlayerRepository.delete(userId);
    }

    async getQueueStatus(userId: string) {
        const queueId = await this.queuedPlayerRepository.getQueueId(userId);
        const hasActiveGame = await this.coreRestClient.checkActiveGame(userId);

        return {
            isQueued: queueId !== null,
            queueId: queueId === '' ? null : queueId,
            hasActiveGame
        };
    }

    async matchMake(queueId: string | null) {
        const queueCount = await this.queueRepository.getQueueCount(queueId);
        if (queueCount < 2) return;
        const players = await this.queueRepository.popQueue(queueId, queueCount);
        if (players === null) {
            throw Error('Not enough player count');
        }
        if (players.length < 2) {
            await Promise.all(
                players.map(async (player) => {
                    return this.queueRepository.pushToQueue(player.value, queueId, player.score);
                })
            );
            throw Error('Not enough player count');
        }

        const playerIds = players.map((player) => {
            return player.value;
        });

        const matches =
            queueId !== null
                ? [[playerIds[0], playerIds[1]] as [string, string]]
                : await this.matchPublicQueue(playerIds, players, queueId);

        for (const match of matches) {
            try {
                const matchPlayerIds = match.flat();
                const response = await this.coreRestClient.createGame(matchPlayerIds);

                await Promise.all([
                    this.queuedPlayerRepository.delete(match[0]),
                    this.queuedPlayerRepository.delete(match[1])
                ]);

                await this.emitMatchmakeMessage(matchPlayerIds, response.gameId);
            } catch (error) {
                console.error(`Failed to create game for ${match}`, error);
                await Promise.all(
                    match.map((playerId) => {
                        const player = players.find((player) => player.value === playerId);
                        const playerQueueTimestamp = player ? player.score : Date.now();
                        return this.queueRepository.pushToQueue(playerId, queueId, playerQueueTimestamp);
                    })
                );
            }
        }
    }

    private async matchPublicQueue(
        playerIds: string[],
        players: Array<{ value: string; score: number }>,
        queueId: string | null
    ): Promise<[string, string][]> {
        const queuedPlayers = await this.queuedPlayerRepository.getBatch(playerIds);
        const matches = matchPlayersByElo(queuedPlayers);

        const matchedPlayerIds = matches.flat();
        const unmatchedPlayers = players.filter((player) => !matchedPlayerIds.includes(player.value));
        await Promise.all(
            unmatchedPlayers.map((player) => {
                return this.queueRepository.pushToQueue(player.value, queueId, player.score);
            })
        );

        return matches;
    }

    private async emitMatchmakeMessage(playerIds: string[], gameId: string) {
        const socketIds = (
            await Promise.all(
                playerIds.map(async (playerId) => {
                    return await this.socketIdRepository.getSocketIdForUser(playerId);
                })
            )
        ).filter((socketId) => socketId !== null && socketId !== undefined);
        if (socketIds.length !== 2) {
            throw Error('Socket ids are missing for some players');
        }
        socketIds.forEach((socketId) => {
            this.matchmakingNotificationService.sendMatchmakeNotification(socketId, gameId);
        });
    }
}

export default MatchmakingService;
