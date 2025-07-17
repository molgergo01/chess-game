import { inject, injectable } from 'inversify';
import GameService from '../services/game.service';
import { NextFunction, Request, Response } from 'express';
import { CreateGameRequest, CreateGameResponse } from '../models/game';

@injectable()
class GameController {
    constructor(
        @inject(GameService)
        public readonly gameService: GameService
    ) {}

    async createGame(
        req: Request<unknown, unknown, CreateGameRequest>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const gameCreated = await this.gameService.create(req.body.players);
            const responseBody: CreateGameResponse = {
                players: Object.fromEntries(gameCreated.players),
                gameId: gameCreated.gameId
            };
            res.status(201).json(responseBody);
        } catch (error) {
            next(error);
        }
    }
}

export default GameController;
