import {
    DEFAULT_START_TIMEOUT_IN_MINUTES,
    TIMER_WATCHER_HEARTBEAT_IN_SECONDS
} from '../config/constants';
import { inject, injectable } from 'inversify';
import GameStateRepository from '../repositories/gameState.repository';
import GameService from './game.service';
import { io } from '../server';
import { Color, TimeExpiredMessage, Winner } from '../models/game';

@injectable()
class TimerWatcher {
    //TODO Leader election
    //TODO Make cron job
    constructor(
        @inject(GameStateRepository)
        private readonly gameStateRepository: GameStateRepository,
        @inject(GameService)
        private readonly gameService: GameService,
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
        const gameStateKeys = await this.gameStateRepository.keys();
        if (gameStateKeys.length === 0) {
            await this.stop();
            return;
        }

        for (const gameStateKey of gameStateKeys) {
            await this.checkGameTimers(gameStateKey);
        }
    }

    private async checkGameTimers(gameStateKey: string) {
        const gameId = gameStateKey.split(':')[1];
        const gameState = await this.gameService.getGameState(gameId);

        const currentTime = Date.now();

        if (gameState.lastMoveEpoch === 0) {
            if (
                currentTime - gameState.startedAt >
                DEFAULT_START_TIMEOUT_IN_MINUTES * 60 * 1000
            ) {
                await this.handleTimeExpired(gameId, Winner.DRAW);
            }
            return;
        }

        const timeSinceLastMove = currentTime - gameState.lastMoveEpoch;

        const currentPlayer = gameState.players.find(
            (player) => player.color === gameState.game.turn()
        );

        const remainingTime =
            currentPlayer!.timer.remainingMs - timeSinceLastMove;

        if (remainingTime <= 0) {
            const winner =
                currentPlayer!.color === Color.WHITE
                    ? Winner.BLACK
                    : Winner.WHITE;
            await this.handleTimeExpired(gameId, winner);
        }
    }

    private async handleTimeExpired(gameId: string, winner: Winner) {
        await this.gameService.reset(gameId);
        const message: TimeExpiredMessage = {
            winner: winner
        };
        io.to(gameId).emit('time-expired', message);
    }

    private async stop() {
        if (this.watcherInterval) {
            clearInterval(this.watcherInterval);
            this.watcherInterval = null;
        }
    }
}

export default TimerWatcher;
