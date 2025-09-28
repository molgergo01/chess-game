import { inject, injectable } from 'inversify';
import QueueRepository from '../repositories/queue.repository';
import { SocketIdRepository } from '../repositories/socket.id.repository';
import CoreRestClient from '../clients/core.rest.client';
import ConflictError from 'chess-game-backend-common/errors/conlfict.error';
import NotFoundError from 'chess-game-backend-common/errors/not.found.error';
import { Player } from '../models/game';
import MatchmakingNotificationService from './matchmaking.notification.service';

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
        if (await this.queueRepository.isInQueue(userId)) {
            throw new ConflictError(
                `User with id ${userId} is already in queue`
            );
        }
        this.queueRepository.pushToQueueEnd(userId);
    }

    async leaveQueue(userId: string) {
        if (!(await this.queueRepository.isInQueue(userId))) {
            throw new NotFoundError(`User with id ${userId} is not in queue`);
        }
        this.queueRepository.removeFromQueue(userId);
    }

    async checkInQueue(userId: string) {
        const isInQueue = await this.queueRepository.isInQueue(userId);
        if (!isInQueue) {
            throw new NotFoundError(`User with id ${userId} is not queued`);
        }
    }

    async matchMake() {
        const queueCount = await this.queueRepository.getQueueCount();
        if (queueCount < 2) return;
        const players = await this.queueRepository.popQueue();
        if (players === null) {
            throw Error('Not enough player count');
        }
        if (players.length < 2) {
            players.forEach(this.queueRepository.pushToQueueFront);
            throw Error('Not enough player count');
        }

        const response = await this.coreRestClient.createGame(players);

        await this.emitMatchmakeMessage(response.players, response.gameId);
    }

    private async emitMatchmakeMessage(players: Array<Player>, gameId: string) {
        const playerIds = players.map((player) => player.id);
        const socketIds = (
            await Promise.all(
                playerIds.map(
                    async (playerId) =>
                        await this.socketIdRepository.getSocketIdForUser(
                            playerId
                        )
                )
            )
        ).filter((socketId) => socketId !== null && socketId !== undefined);

        if (socketIds.length !== 2) {
            throw Error('Socket ids are missing for some players');
        }
        socketIds.forEach((socketId) => {
            this.matchmakingNotificationService.sendMatchmakeNotification(
                socketId,
                players,
                gameId
            );
        });
    }
}

export default MatchmakingService;
