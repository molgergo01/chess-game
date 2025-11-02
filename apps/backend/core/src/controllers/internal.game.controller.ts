import { NextFunction, Request, Response } from 'express';
import { CreateGameResponse, GetActiveGameResponse } from '../models/responses';
import { inject, injectable } from 'inversify';
import GameService from '../services/game.service';
import TimerWatcher from '../services/timer.watcher';
import { CreateGameRequest, InternalGetActiveGameQueryParams } from '../models/requests';

@injectable()
class InternalGameController {
    constructor(
        @inject(GameService)
        public readonly gameService: GameService,
        @inject(TimerWatcher)
        private readonly timerWatcher: TimerWatcher
    ) {}

    async createGame(req: Request<unknown, unknown, CreateGameRequest>, res: Response, next: NextFunction) {
        try {
            const gameCreated = await this.gameService.create(req.body.players);
            this.timerWatcher.start();
            const responseBody: CreateGameResponse = {
                players: gameCreated.players,
                gameId: gameCreated.gameId
            };
            res.status(201).json(responseBody);
        } catch (error) {
            next(error);
        }
    }

    async getActiveGame(
        req: Request<unknown, unknown, unknown, InternalGetActiveGameQueryParams>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const result = await this.gameService.getActiveGame(req.query.userId);

            const response: GetActiveGameResponse = {
                gameId: result.game.id,
                whitePlayer: {
                    userId: result.game.whitePlayer.id,
                    name: result.game.whitePlayer.name,
                    elo: result.game.whitePlayer.elo,
                    avatarUrl: result.game.whitePlayer.avatarUrl
                },
                blackPlayer: {
                    userId: result.game.blackPlayer.id,
                    name: result.game.blackPlayer.name,
                    elo: result.game.blackPlayer.elo,
                    avatarUrl: result.game.blackPlayer.avatarUrl
                },
                position: result.position,
                whiteTimeRemaining: result.whiteTimeRemaining,
                blackTimeRemaining: result.blackTimeRemaining,
                gameOver: result.gameOver,
                winner: result.winner,
                drawOffer: result.drawOffer,
                timeUntilAbandoned: result.timeUntilAbandoned
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }
}

export default InternalGameController;
