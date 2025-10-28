import { inject, injectable } from 'inversify';
import GameService from '../services/game.service';
import { NextFunction, Request, Response } from 'express';
import TimerWatcher from '../services/timer.watcher';
import {
    CreateGameResponse,
    GameDto,
    GetActiveGameResponse,
    GetGameHistoryResponse,
    GetGameResponse,
    MoveDto
} from '../models/responses';
import { CreateGameRequest, GetGameParams } from '../models/requests';
import { Move } from '../models/move';
import { Winner } from '../models/game';

@injectable()
class GameController {
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

    async getGameHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.query.userId;

            if (!userId || typeof userId !== 'string') {
                res.status(400).json({ message: 'userId query parameter is required' });
                return;
            }

            let limit: number | null;
            let offset: number | null;

            const limitParam = req.query.limit;
            const offsetParam = req.query.offset;
            if (!limitParam || typeof limitParam !== 'string') {
                limit = null;
            } else {
                limit = parseInt(limitParam);
            }
            if (!offsetParam || typeof offsetParam !== 'string') {
                offset = null;
            } else {
                offset = parseInt(offsetParam);
            }

            const historyResult = await this.gameService.getGameHistory(userId, limit, offset);

            const gameDtos = historyResult.games.map(
                (game): GameDto => ({
                    gameId: game.id,
                    whitePlayer: {
                        userId: game.whitePlayer.id,
                        name: game.whitePlayer.name,
                        elo: game.whitePlayer.elo,
                        avatarUrl: game.whitePlayer.avatarUrl
                    },
                    blackPlayer: {
                        userId: game.blackPlayer.id,
                        name: game.blackPlayer.name,
                        elo: game.blackPlayer.elo,
                        avatarUrl: game.blackPlayer.avatarUrl
                    },
                    startedAt: game.startedAt,
                    // These fallbacks should not happen as null check is performed in the query
                    endedAt: game.endedAt ?? new Date(),
                    winner: game.winner ?? Winner.DRAW
                })
            );
            const response: GetGameHistoryResponse = {
                games: gameDtos,
                totalCount: historyResult.totalCount
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getGame(req: Request<GetGameParams, unknown, unknown>, res: Response, next: NextFunction) {
        try {
            const gameWithMoves = await this.gameService.getGameWithMoves(req.params.gameId);

            const moveDtos = gameWithMoves.moves.map(
                (move: Move): MoveDto => ({
                    moveNumber: move.moveNumber,
                    playerColor: move.playerColor,
                    moveNotation: move.moveNotation,
                    positionFen: move.positionFen,
                    whitePlayerTime: move.whitePlayerTime,
                    blackPlayerTime: move.blackPlayerTime
                })
            );
            const response: GetGameResponse = {
                gameId: gameWithMoves.id,
                whitePlayer: {
                    userId: gameWithMoves.whitePlayer.id,
                    name: gameWithMoves.whitePlayer.name,
                    elo: gameWithMoves.whitePlayer.elo,
                    avatarUrl: gameWithMoves.whitePlayer.avatarUrl
                },
                blackPlayer: {
                    userId: gameWithMoves.blackPlayer.id,
                    name: gameWithMoves.blackPlayer.name,
                    elo: gameWithMoves.blackPlayer.elo,
                    avatarUrl: gameWithMoves.blackPlayer.avatarUrl
                },
                startedAt: gameWithMoves.startedAt,
                // These fallbacks should not happen as null check is performed in the service
                endedAt: gameWithMoves.endedAt ?? new Date(),
                winner: gameWithMoves.winner ?? Winner.DRAW,
                moves: moveDtos
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getActiveGame(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.query.userId;

            if (!userId || typeof userId !== 'string') {
                res.status(400).json({ message: 'userId query parameter is required' });
                return;
            }

            const result = await this.gameService.getActiveGame(userId);

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
                winner: result.winner
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }
}

export default GameController;
