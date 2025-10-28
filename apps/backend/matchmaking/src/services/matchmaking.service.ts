import { inject, injectable } from 'inversify';
import QueueRepository from '../repositories/queue.repository';
import { SocketIdRepository } from '../repositories/socket.id.repository';
import CoreRestClient from '../clients/core.rest.client';
import ConflictError from 'chess-game-backend-common/errors/conflict.error';
import NotFoundError from 'chess-game-backend-common/errors/not.found.error';
import MatchmakingNotificationService from './matchmaking.notification.service';
import { v4 as uuidv4 } from 'uuid';

@injectable()
class MatchmakingService {
    constructor(
        @inject(QueueRepository)
        public readonly queueRepository: QueueRepository,
        @inject(SocketIdRepository)
        public readonly socketIdRepository: SocketIdRepository,
        @inject(CoreRestClient)
        private readonly coreRestClient: CoreRestClient,
        @inject(MatchmakingNotificationService)
        private readonly matchmakingNotificationService: MatchmakingNotificationService
    ) {}

    setSocketIdForUser(userId: string, socketId: string) {
        this.socketIdRepository.setSocketIdForUser(userId, socketId);
    }

    async joinQueue(userId: string) {
        if ((await this.queueRepository.getQueueId(userId)) !== null) {
            throw new ConflictError(`User with id ${userId} is already in queue`);
        }
        if (await this.coreRestClient.checkActiveGame(userId)) {
            throw new ConflictError('User is already in an active game');
        }
        this.queueRepository.pushToQueueEnd(userId, null);
    }

    async createPrivateQueue(userId: string): Promise<string> {
        if ((await this.queueRepository.getQueueId(userId)) !== null) {
            throw new ConflictError(`User with id ${userId} is already in queue`);
        }
        if (await this.coreRestClient.checkActiveGame(userId)) {
            throw new ConflictError('User is already in an active game');
        }

        const queueId = uuidv4();

        this.queueRepository.pushToQueueEnd(userId, queueId);
        return queueId;
    }

    async joinPrivateQueue(userId: string, queueId: string) {
        if ((await this.queueRepository.getQueueId(userId)) !== null) {
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
        this.queueRepository.pushToQueueEnd(userId, queueId);
        if (queueCount == 1) {
            await this.matchMake(queueId);
        }
    }

    async leaveQueue(userId: string, queueId: string | null) {
        if ((await this.queueRepository.getQueueId(userId)) === null) {
            throw new NotFoundError(`User with id ${userId} is not in queue`);
        }
        this.queueRepository.removeFromQueue(userId, queueId);
    }

    async getQueueStatus(userId: string) {
        const queueId = await this.queueRepository.getQueueId(userId);
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
        const players = await this.queueRepository.popQueue(queueId);
        if (players === null) {
            throw Error('Not enough player count');
        }
        if (players.length < 2) {
            players.forEach((player) => {
                this.queueRepository.pushToQueueFront(player, queueId);
            });
            throw Error('Not enough player count');
        }

        const response = await this.coreRestClient.createGame(players);

        await this.emitMatchmakeMessage(players, response.gameId);
    }

    private async emitMatchmakeMessage(playerIds: string[], gameId: string) {
        const socketIds = (
            await Promise.all(
                playerIds.map(async (playerId) => await this.socketIdRepository.getSocketIdForUser(playerId))
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
