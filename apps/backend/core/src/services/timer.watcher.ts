import { DEFAULT_START_TIMEOUT_IN_MINUTES, TIMER_WATCHER_HEARTBEAT_IN_SECONDS } from '../config/constants';
import { inject, injectable } from 'inversify';
import GameStateRepository from '../repositories/gameState.repository';
import GameService from './game.service';
import { Color, Winner } from '../models/game';
import GameNotificationService from './game.notification.service';
import { Transactional } from 'chess-game-backend-common/transaction/transactional.decorator';
import {
    RedisTransactional,
    TransactionPropagation
} from 'chess-game-backend-common/transaction/redis-transactional.decorator';

@injectable()
class TimerWatcher {
    //TODO Leader election
    //TODO Make cron job
    constructor(
        @inject(GameStateRepository)
        private readonly gameStateRepository: GameStateRepository,
        @inject(GameService)
        private readonly gameService: GameService,
        @inject(GameNotificationService)
        private readonly gameNotificationService: GameNotificationService,
        private watcherInterval: NodeJS.Timeout | null = null
    ) {
        this.watcherInterval = watcherInterval;
    }

    start() {
        if (this.watcherInterval) return;
        this.watcherInterval = setInterval(async () => {
            await this.checkAllGames();
        }, TIMER_WATCHER_HEARTBEAT_IN_SECONDS * 1000);
    }

    private async checkAllGames() {
        const gameStateKeys = await this.gameStateRepository.getKeys();
        if (gameStateKeys.length === 0) {
            await this.stop();
            return;
        }

        for (const gameStateKey of gameStateKeys) {
            try {
                await this.checkGameTimers(gameStateKey);
            } catch (error) {
                console.error(`timer checking failed for game state ${gameStateKey}`, error);
            }
        }
    }

    @Transactional()
    @RedisTransactional({ propagation: TransactionPropagation.REQUIRES_NEW })
    private async checkGameTimers(gameStateKey: string) {
        const gameId = gameStateKey.split(':')[1];
        const gameState = await this.gameService.getGameState(gameId);

        const currentTime = Date.now();

        if (gameState.lastMoveEpoch === 0) {
            if (currentTime - gameState.startedAt > DEFAULT_START_TIMEOUT_IN_MINUTES * 60 * 1000) {
                await this.handleTimeExpired(gameId, Winner.DRAW);
            }
            return;
        }

        const timeSinceLastMove = currentTime - gameState.lastMoveEpoch;

        const currentPlayer = gameState.players.find((player) => player.color === gameState.game.turn());

        const remainingTime = currentPlayer!.timer.remainingMs - timeSinceLastMove;

        if (remainingTime <= 0) {
            const winner = currentPlayer!.color === Color.WHITE ? Winner.BLACK : Winner.WHITE;
            await this.handleTimeExpired(gameId, winner);
        }
    }

    private async handleTimeExpired(gameId: string, winner: Winner) {
        const ratingChange = await this.gameService.reset(gameId);

        this.gameNotificationService.sendGameOverNotification(gameId, winner, ratingChange);
    }

    private async stop() {
        if (this.watcherInterval) {
            clearInterval(this.watcherInterval);
            this.watcherInterval = null;
        }
    }
}

export default TimerWatcher;
