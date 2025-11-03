import {
    ActiveGame,
    Color,
    DrawOffer,
    Game,
    GameCreated,
    GameHistoryResult,
    GameOverResult,
    GameState,
    GameWithMoves,
    RatingChange,
    Winner
} from '../models/game';
import { Chess } from 'chess.js';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import { inject, injectable } from 'inversify';
import GameStateRepository from '../repositories/gameState.repository';
import GameIdRepository from '../repositories/gameId.repository';
import { Player, PlayerTimes } from '../models/player';
import { Timer } from '../models/timer';
import BadRequestError from 'chess-game-backend-common/errors/bad.request.error';
import NotFoundError from 'chess-game-backend-common/errors/not.found.error';
import ForbiddenError from 'chess-game-backend-common/errors/forbidden.error';
import InternalServerError from 'chess-game-backend-common/errors/internal.server.error';
import GamesRepository from '../repositories/games.repository';
import MovesRepository from '../repositories/moves.repository';
import { Move } from '../models/move';
import ConflictError from 'chess-game-backend-common/errors/conflict.error';
import RatingService from './rating.service';
import ChatService from './chat.service';
import { DEFAULT_START_TIMEOUT_IN_MINUTES } from '../config/constants';
import InvalidMoveError from '../errors/invalid.move.error';
import NotPlayersTurnError from '../errors/not.players.turn.error';

@injectable()
class GameService {
    games: Map<string, GameState>;

    constructor(
        @inject(GameStateRepository)
        private readonly gameStateRepository: GameStateRepository,
        @inject(GameIdRepository)
        private readonly gameIdRepository: GameIdRepository,
        @inject(GamesRepository)
        private readonly gamesRepository: GamesRepository,
        @inject(MovesRepository)
        private readonly movesRepository: MovesRepository,
        @inject(RatingService)
        private readonly ratingService: RatingService,
        @inject(ChatService)
        private readonly chatService: ChatService
    ) {
        this.games = new Map();
    }

    async create(playerIds: string[]): Promise<GameCreated> {
        if (playerIds.length !== 2) {
            throw new BadRequestError('playerIds must be exactly 2 players');
        }
        if (playerIds[0] === playerIds[1]) {
            throw new BadRequestError('playerIds must be 2 distinct players');
        }

        const isAnyPlayerInGame = await this.gamesRepository.existsActiveGameByUserIds(playerIds);
        if (isAnyPlayerInGame) {
            throw new ConflictError('A player is already in game');
        }

        const playersWithColors = this.assignColorsToPlayers(playerIds);
        const id = uuidv4();
        const game = new Chess();

        const players: Array<Player> = [];
        playersWithColors.forEach((value: Color, key: string) => {
            const player: Player = {
                id: key,
                color: value,
                timer: new Timer()
            };
            players.push(player);
        });

        const startedAt = Date.now();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const blackPlayerId = Array.from(playersWithColors.entries()).find(([_, color]) => color === Color.BLACK)?.[0];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const whitePlayerId = Array.from(playersWithColors.entries()).find(([_, color]) => color === Color.WHITE)?.[0];
        if (!blackPlayerId || !whitePlayerId) {
            throw new InternalServerError('Game creation failed due to player assigning error');
        }
        const gameEntity: Game = {
            id: id,
            blackPlayerId: blackPlayerId,
            whitePlayerId: whitePlayerId,
            startedAt: new Date(startedAt),
            endedAt: null,
            winner: null
        };
        await this.gamesRepository.save(gameEntity);

        await this.gameStateRepository.save(id, game.fen(), players, 0, startedAt, undefined);
        playerIds.forEach((player) => {
            this.gameIdRepository.save(player, id);
        });

        const gameState: GameState = {
            players: players,
            game: game,
            lastMoveEpoch: 0,
            startedAt: startedAt,
            drawOffer: undefined
        };
        this.games.set(id, gameState);
        return {
            gameId: id,
            players: players
        };
    }

    async getGameId(userId: string): Promise<string | null> {
        return this.gameIdRepository.get(userId);
    }

    async getTimes(gameId: string, requestTimeStamp: number | null = null): Promise<PlayerTimes> {
        const gameState = await this.getGameState(gameId);

        return this.getPlayerTimesFromGameState(gameState, requestTimeStamp);
    }

    async move(
        userId: string,
        gameId: string,
        from: string,
        to: string,
        promotionPiece: string | undefined,
        requestTimestamp: number
    ): Promise<string> {
        const gameState = await this.getGameState(gameId);
        const game = gameState.game;

        const currentPlayer = gameState.players.find((player) => player.id === userId);
        if (!currentPlayer) throw new ForbiddenError(`User ${userId} is not part of game ${gameId}`);
        const userColor = currentPlayer.color;

        if (game.turn() !== userColor) throw new NotPlayersTurnError(`It is not ${userColor}'s turn`);

        const upcomingMoveNumber = game.moveNumber();
        let move;
        try {
            move = game.move({ from: from, to: to, promotion: promotionPiece });
        } catch {
            throw new InvalidMoveError('Invalid move');
        }
        this.refreshPlayerTimes(gameState, currentPlayer, requestTimestamp);
        gameState.lastMoveEpoch = requestTimestamp;
        await this.gameStateRepository.save(
            gameId,
            game.fen(),
            gameState.players,
            requestTimestamp,
            gameState.startedAt,
            gameState.drawOffer
        );

        const moveId = uuidv4();
        const whitePlayerTime = gameState.players.find((player) => player.color === Color.WHITE)?.timer.remainingMs;
        const blackPlayerTime = gameState.players.find((player) => player.color === Color.BLACK)?.timer.remainingMs;
        if (!whitePlayerTime || !blackPlayerTime) throw new Error('Game state is corrupted');
        const moveEntity: Move = {
            id: moveId,
            gameId: gameId,
            moveNumber: upcomingMoveNumber,
            playerColor: userColor,
            moveNotation: move.san,
            positionFen: game.fen(),
            whitePlayerTime: whitePlayerTime,
            blackPlayerTime: blackPlayerTime,
            createdAt: new Date(requestTimestamp)
        };
        await this.movesRepository.save(moveEntity);

        return game.fen();
    }

    async getFen(gameId: string): Promise<string> {
        const gameState = await this.getGameState(gameId);
        const game = gameState.game;
        return game.fen();
    }

    async isGameOver(gameId: string): Promise<boolean> {
        const gameState = await this.getGameState(gameId);
        const game = gameState.game;
        const timeRanOut = gameState.players.some((player) => player.timer.remainingMs <= 0);
        return game.isGameOver() || timeRanOut;
    }

    async getWinner(gameId: string): Promise<Winner | null> {
        const gameState = await this.getGameState(gameId);
        const game = gameState.game;

        if (gameState.lastMoveEpoch === 0) {
            return Winner.DRAW;
        }

        const timeSinceLastMove = Date.now() - gameState.lastMoveEpoch;
        const currentPlayer = gameState.players.find((player) => player.color === gameState.game.turn());
        const currentPlayerRemainingTime = currentPlayer!.timer.remainingMs - timeSinceLastMove;

        if (currentPlayerRemainingTime <= 0) {
            return currentPlayer?.color === Color.BLACK ? Winner.WHITE : Winner.BLACK;
        }

        const timeRanOutPlayer = gameState.players.find((player) => player.timer.remainingMs <= 0);
        if (timeRanOutPlayer) {
            return timeRanOutPlayer.color === Color.BLACK ? Winner.WHITE : Winner.BLACK;
        }

        if (game.isDraw()) {
            return Winner.DRAW;
        } else if (game.isCheckmate()) {
            return game.turn() === 'w' ? Winner.BLACK : Winner.WHITE;
        }

        return null;
    }

    async reset(gameId: string, winner?: Winner): Promise<RatingChange> {
        const game = await this.gamesRepository.findById(gameId);
        if (!game) throw new Error('Game not found');
        game.endedAt = new Date();
        const gameWinner = await this.getWinner(gameId);
        const actualWinner = gameWinner ? gameWinner : winner;
        if (!actualWinner) {
            // should not happen
            throw new Error('Game was not finished properly');
        }
        game.winner = actualWinner;

        await this.gamesRepository.update(game);

        await this.gameStateRepository.remove(gameId);
        await this.gameIdRepository.remove(gameId);
        this.games.delete(gameId);

        await this.chatService.deleteChat(gameId);

        return await this.ratingService.adjustRatings(game.whitePlayerId, game.blackPlayerId, actualWinner);
    }

    async getGameState(gameId: string): Promise<GameState> {
        let gameState = this.games.get(gameId);
        if (gameState) return gameState;

        const storedGameState = await this.gameStateRepository.get(gameId);
        if (storedGameState === null) throw new NotFoundError(`Game with id ${gameId} could not be found`);

        gameState = {
            players: storedGameState.players.map((storedPlayer): Player => {
                return {
                    id: storedPlayer.id,
                    color: storedPlayer.color,
                    timer: new Timer(storedPlayer.timer.remainingMs)
                };
            }),
            game: new Chess(storedGameState.position),
            lastMoveEpoch: storedGameState.lastMoveEpoch,
            startedAt: storedGameState.startedAt,
            drawOffer: storedGameState.drawOffer
        };
        this.games.set(gameId, gameState);
        return gameState;
    }

    async getGameHistory(
        userId: string,
        limit: number | undefined,
        offset: number | undefined
    ): Promise<GameHistoryResult> {
        if (limit && Number(limit) < 0) {
            throw new BadRequestError('Limit must be a non-negative number');
        }
        if (offset && Number(offset) < 0) {
            throw new BadRequestError('Offset must be a non-negative number');
        }

        const games = await this.gamesRepository.findAllByUserId(userId, limit, offset);
        const totalGamesCount = await this.gamesRepository.countAllByUserId(userId);

        return {
            games: games,
            totalCount: totalGamesCount
        };
    }

    async getGameWithMoves(gameId: string): Promise<GameWithMoves> {
        if (!validateUuid(gameId)) {
            throw new BadRequestError(`Invalid game with id ${gameId}`);
        }
        const game = await this.gamesRepository.findByIdWithMoves(gameId);
        if (!game) {
            throw new NotFoundError(`Game with id ${gameId} not found`);
        }
        if (game.endedAt === null || game.winner === null) {
            throw new BadRequestError(`Game with id ${gameId} is still in progress`);
        }

        return game;
    }

    async getActiveGame(userId: string): Promise<ActiveGame> {
        const game = await this.gamesRepository.findActiveGameByUserId(userId);
        if (!game) {
            throw new NotFoundError('No active game found for user');
        }

        const gameState = await this.getGameState(game.id);
        const position = gameState.game.fen();
        const times = this.getPlayerTimesFromGameState(gameState, Date.now());
        const isGameOver = await this.isGameOver(game.id);
        const winner = isGameOver ? await this.getWinner(game.id) : null;

        const timeSinceStarted = Date.now() - gameState.startedAt;
        const timeUntilAbandoned =
            gameState.lastMoveEpoch === 0 ? DEFAULT_START_TIMEOUT_IN_MINUTES * 60 * 1000 - timeSinceStarted : null;

        return {
            game: game,
            position: position,
            whiteTimeRemaining: times.whiteTimeRemaining,
            blackTimeRemaining: times.blackTimeRemaining,
            gameOver: isGameOver,
            winner: winner,
            drawOffer: gameState.drawOffer,
            timeUntilAbandoned: timeUntilAbandoned
        };
    }

    async resign(userId: string, gameId: string): Promise<GameOverResult> {
        const gameState = await this.getGameState(gameId);

        const currentPlayer = gameState.players.find((player) => player.id === userId);
        if (!currentPlayer) throw new ForbiddenError(`User ${userId} is not part of game ${gameId}`);

        const selectedWinner = currentPlayer.color === Color.BLACK ? Winner.WHITE : Winner.BLACK;
        const gameWinner = await this.getWinner(gameId);
        const actualWinner = gameWinner ? gameWinner : selectedWinner;
        const ratingChange = await this.reset(gameId, actualWinner);

        return {
            winner: actualWinner,
            ratingChange: ratingChange
        };
    }

    async offerDraw(gameId: string, userId: string): Promise<DrawOffer> {
        const requestTime = Date.now();

        const gameState = await this.getGameState(gameId);
        const game = gameState.game;

        const currentPlayer = gameState.players.find((player) => player.id === userId);
        if (!currentPlayer) throw new ForbiddenError(`User ${userId} is not part of game ${gameId}`);

        if (gameState.drawOffer && gameState.drawOffer.expiresAt.getTime() >= requestTime) {
            throw new ConflictError('Draw offer is already in progress');
        }

        const drawOffer: DrawOffer = {
            offeredBy: currentPlayer.color,
            expiresAt: new Date(requestTime + 30000) // 30 sec draw offer
        };

        gameState.drawOffer = drawOffer;
        await this.gameStateRepository.save(
            gameId,
            game.fen(),
            gameState.players,
            gameState.lastMoveEpoch,
            gameState.startedAt,
            drawOffer
        );

        return drawOffer;
    }

    async respondDrawOffer(gameId: string, userId: string, accepted: boolean): Promise<RatingChange | null> {
        const gameState = await this.getGameState(gameId);
        const game = gameState.game;

        const currentPlayer = gameState.players.find((player) => player.id === userId);
        if (!currentPlayer) throw new ForbiddenError(`User ${userId} is not part of game ${gameId}`);

        gameState.drawOffer = undefined;
        await this.gameStateRepository.save(
            gameId,
            game.fen(),
            gameState.players,
            gameState.lastMoveEpoch,
            gameState.startedAt,
            undefined
        );

        return accepted ? await this.reset(gameId, Winner.DRAW) : null;
    }

    async getPlayerColor(gameId: string, userId: string): Promise<Color> {
        const gameState = await this.getGameState(gameId);

        const currentPlayer = gameState.players.find((player) => player.id === userId);
        if (!currentPlayer) throw new ForbiddenError(`User ${userId} is not part of game ${gameId}`);

        return currentPlayer.color;
    }

    private refreshPlayerTimes(gameState: GameState, currentPlayer: Player, requestTimestamp: number) {
        if (gameState.lastMoveEpoch !== 0) {
            currentPlayer.timer.decrementTimer(requestTimestamp - gameState.lastMoveEpoch);
        }
    }

    private getPlayerTimesFromGameState(gameState: GameState, requestTimestamp: number | null = null): PlayerTimes {
        const blackPlayer = gameState.players.find((player) => player.color === Color.BLACK)!;
        const whitePlayer = gameState.players.find((player) => player.color === Color.WHITE)!;

        let blackTimeRemaining = blackPlayer.timer.remainingMs;
        let whiteTimeRemaining = whitePlayer.timer.remainingMs;

        if (requestTimestamp && gameState.lastMoveEpoch !== 0) {
            const elapsedTime = requestTimestamp - gameState.lastMoveEpoch;
            if (gameState.game.turn() === Color.BLACK) {
                blackTimeRemaining -= elapsedTime;
            } else {
                whiteTimeRemaining -= elapsedTime;
            }
        }

        return {
            blackTimeRemaining: blackTimeRemaining,
            whiteTimeRemaining: whiteTimeRemaining
        };
    }

    private assignColorsToPlayers(players: string[]): Map<string, Color> {
        if (players.length !== 2) {
            throw new BadRequestError('Chess game requires exactly 2 players');
        }

        const colors: Color[] = [Color.WHITE, Color.BLACK];
        const playersWithColors = new Map<string, Color>();

        const shuffledColors = colors.sort(() => Math.random() - 0.5);

        players.forEach((player, index) => {
            playersWithColors.set(player, shuffledColors[index]);
        });

        return playersWithColors;
    }
}

export default GameService;
