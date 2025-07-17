import { Color, GameCreated, GameState, Winner } from '../models/game';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { inject, injectable } from 'inversify';
import GameStateRepository from '../repositories/gameState.repository';
import GameIdRepository from '../repositories/gameId.repository';

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

    async create(players: string[]): Promise<GameCreated> {
        const playersWithColors = this.assignColorsToPlayers(players);
        const id = uuidv4();
        const game = new Chess();
        this.gameStateRepository.save(id, game.fen(), playersWithColors);
        players.forEach((player) => {
            this.gameIdRepository.save(player, id);
        });
        const gameState: GameState = {
            players: playersWithColors,
            game: game
        };
        this.games.set(id, gameState);
        return {
            gameId: id,
            players: playersWithColors
        };
    }

    async getGameId(userId: string): Promise<string | null> {
        return this.gameIdRepository.getGameId(userId);
    }

    async move(
        userId: string,
        gameId: string,
        from: string,
        to: string,
        promotionPiece: string | undefined
    ): Promise<string> {
        const gameState = await this.getGameState(gameId);
        const game = gameState.game;
        const playersColors = await this.gameStateRepository.getPlayers(gameId);
        if (!playersColors)
            throw new Error(`Could not retrieve players for ${gameId}`);
        const userColor = playersColors.get(userId);
        if (!userColor)
            throw new Error(`User ${userId} is not part of game ${gameId}`);

        if (game.turn() !== userColor)
            throw new Error(`It is not ${userColor}'s turn`);
        game.move({ from: from, to: to, promotion: promotionPiece });
        this.gameStateRepository.savePosition(gameId, game.fen());
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
        return game.isGameOver();
    }

    async getWinner(gameId: string): Promise<Winner | null> {
        const gameState = await this.getGameState(gameId);
        const game = gameState.game;
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
            players: storedGameState.players,
            game: new Chess(storedGameState.position)
        };
        this.games.set(gameId, gameState);
        return gameState;
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
