import {
    Color,
    GameCreated,
    GameState,
    PlayerTimes,
    Winner
} from '../models/game';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { inject, injectable } from 'inversify';
import GameStateRepository from '../repositories/gameState.repository';
import GameIdRepository from '../repositories/gameId.repository';
import { Player } from '../models/player';
import { Timer } from '../models/timer';

@injectable()
class GameService {
    games: Map<string, GameState>;

    constructor(
        @inject(GameStateRepository)
        private readonly gameStateRepository: GameStateRepository,
        @inject(GameIdRepository)
        private readonly gameIdRepository: GameIdRepository
    ) {
        this.games = new Map();
    }

    async create(playerIds: string[]): Promise<GameCreated> {
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
        this.gameStateRepository.save(id, game.fen(), players, 0, startedAt);
        playerIds.forEach((player) => {
            this.gameIdRepository.save(player, id);
        });

        const gameState: GameState = {
            players: players,
            game: game,
            lastMoveEpoch: 0,
            startedAt: startedAt
        };
        this.games.set(id, gameState);
        return {
            gameId: id,
            players: players
        };
    }

    async getGameId(userId: string): Promise<string | null> {
        return this.gameIdRepository.getGameId(userId);
    }

    async getTimes(
        gameId: string,
        requestTimeStamp: number | null = null
    ): Promise<PlayerTimes> {
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

        const currentPlayer = gameState.players.find(
            (player) => player.id === userId
        );
        if (!currentPlayer)
            throw new Error(`User ${userId} is not part of game ${gameId}`);
        const userColor = currentPlayer.color;

        if (game.turn() !== userColor)
            throw new Error(`It is not ${userColor}'s turn`);

        game.move({ from: from, to: to, promotion: promotionPiece });
        this.refreshPlayerTimes(gameState, currentPlayer, requestTimestamp);
        gameState.lastMoveEpoch = requestTimestamp;
        this.gameStateRepository.save(
            gameId,
            game.fen(),
            gameState.players,
            requestTimestamp,
            gameState.startedAt
        );

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
        const timeRanOut = gameState.players.some(
            (player) => player.timer.remainingMs <= 0
        );
        return game.isGameOver() || timeRanOut;
    }

    async getWinner(gameId: string): Promise<Winner | null> {
        const gameState = await this.getGameState(gameId);
        const game = gameState.game;

        const timeRanOutPlayer = gameState.players.find(
            (player) => player.timer.remainingMs <= 0
        );
        if (timeRanOutPlayer) {
            return timeRanOutPlayer.color === Color.BLACK
                ? Winner.WHITE
                : Winner.BLACK;
        }
        if (game.isDraw()) {
            return Winner.DRAW;
        } else if (game.isCheckmate()) {
            return game.turn() === 'w' ? Winner.BLACK : Winner.WHITE;
        }

        return null;
    }

    async reset(gameId: string): Promise<void> {
        await this.gameStateRepository.removeGameState(gameId);
        await this.gameIdRepository.removeByGameId(gameId);
        this.games.delete(gameId);
    }

    async getGameState(gameId: string): Promise<GameState> {
        let gameState = this.games.get(gameId);
        if (gameState) return gameState;

        const storedGameState = await this.gameStateRepository.get(gameId);
        if (storedGameState === null)
            throw new Error(`Game with id ${gameId} could not be found`);

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
            startedAt: storedGameState.startedAt
        };
        this.games.set(gameId, gameState);
        return gameState;
    }

    private getCurrentPlayer(gameState: GameState): Player {
        const turnColor = gameState.game.turn() as Color;

        return gameState.players.find((player) => player.color === turnColor)!;
    }

    private refreshPlayerTimes(
        gameState: GameState,
        currentPlayer: Player,
        requestTimestamp: number
    ) {
        if (gameState.lastMoveEpoch !== 0) {
            currentPlayer.timer.decrementTimer(
                requestTimestamp - gameState.lastMoveEpoch
            );
        }
    }

    private getPlayerTimesFromGameState(
        gameState: GameState,
        requestTimestamp: number | null = null
    ): PlayerTimes {
        const blackPlayer = gameState.players.find(
            (player) => player.color === Color.BLACK
        )!;
        const whitePlayer = gameState.players.find(
            (player) => player.color === Color.WHITE
        )!;

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
            throw new Error('Chess game requires exactly 2 players');
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
