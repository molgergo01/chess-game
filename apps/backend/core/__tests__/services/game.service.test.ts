import { Color, GameCreated, GameState, StoredGameState, Winner } from '../../src/models/game';
import GameService from '../../src/services/game.service';
import GameStateRepository from '../../src/repositories/gameState.repository';
import GameIdRepository from '../../src/repositories/gameId.repository';
import { Player, StoredPlayer } from '../../src/models/player';
import { Timer } from '../../src/models/timer';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import BadRequestError from 'chess-game-backend-common/errors/bad.request.error';
import NotFoundError from 'chess-game-backend-common/errors/not.found.error';
import ForbiddenError from 'chess-game-backend-common/errors/forbidden.error';
import { Chess } from 'chess.js';
import Fen from 'chess-fen';
import GamesRepository from '../../src/repositories/games.repository';
import MovesRepository from '../../src/repositories/moves.repository';
import ConflictError from 'chess-game-backend-common/errors/conflict.error';

const mockGame = {
    fen: jest.fn(),
    move: jest.fn(),
    isGameOver: jest.fn(),
    isDraw: jest.fn(),
    isCheckmate: jest.fn(),
    turn: jest.fn(),
    moveNumber: jest.fn()
};

jest.mock('chess.js', () => ({
    Chess: jest.fn().mockImplementation(() => mockGame)
}));

jest.mock('uuid', () => ({
    v4: jest.fn(),
    validate: jest.fn()
}));

jest.spyOn(Math, 'random');

jest.mock('../../src/repositories/gameState.repository');
jest.mock('../../src/repositories/gameId.repository');
jest.mock('../../src/repositories/games.repository');
jest.mock('../../src/repositories/moves.repository');

describe('Game Service', () => {
    const NOW = 10000000;

    let mockGameStateRepository: jest.Mocked<GameStateRepository>;
    let mockGameIdRepository: jest.Mocked<GameIdRepository>;
    let mockGamesRepository: jest.Mocked<GamesRepository>;
    let mockMovesRepository: jest.Mocked<MovesRepository>;
    let gameService: GameService;

    let mockUuid = jest.fn();
    let mockValidateUuid = jest.fn();

    beforeEach(() => {
        mockUuid = jest.mocked(uuidv4);
        mockValidateUuid = jest.mocked(validateUuid);

        jest.useFakeTimers();
        jest.setSystemTime(NOW);

        mockGameStateRepository = new GameStateRepository(null as never) as jest.Mocked<GameStateRepository>;
        mockGameStateRepository.save = jest.fn();
        mockGameStateRepository.remove = jest.fn();
        mockGameStateRepository.get = jest.fn();

        mockGameIdRepository = new GameIdRepository(null as never) as jest.Mocked<GameIdRepository>;
        mockGameIdRepository.save = jest.fn();
        mockGameIdRepository.get = jest.fn();
        mockGameIdRepository.remove = jest.fn();

        mockGamesRepository = new GamesRepository() as jest.Mocked<GamesRepository>;
        mockGamesRepository.findById = jest.fn();
        mockGamesRepository.findAllByUserId = jest.fn();
        mockGamesRepository.findByIdWithMoves = jest.fn();
        mockGamesRepository.countAllByUserId = jest.fn();
        mockGamesRepository.save = jest.fn();
        mockGamesRepository.update = jest.fn();
        mockGamesRepository.existsActiveGameByUserIds = jest.fn();
        mockGamesRepository.findActiveGameByUserId = jest.fn();

        mockMovesRepository = new MovesRepository() as jest.Mocked<MovesRepository>;
        mockMovesRepository.save = jest.fn();

        gameService = new GameService(
            mockGameStateRepository,
            mockGameIdRepository,
            mockGamesRepository,
            mockMovesRepository
        );
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('Create', () => {
        it('should create game', async () => {
            const playerIds = ['1234', '5678'];

            const gameId = '0000';
            mockUuid.mockReturnValue(gameId);

            const player1: Player = {
                id: '1234',
                color: Color.WHITE,
                timer: new Timer()
            };

            const player2: Player = {
                id: '5678',
                color: Color.BLACK,
                timer: new Timer()
            };

            (Math.random as jest.Mock).mockReturnValue(0.6);

            const fen = Fen.startingPosition;
            mockGame.fen.mockReturnValue(fen);

            const expectedResult: GameCreated = {
                gameId: gameId,
                players: [player1, player2]
            };

            const result = await gameService.create(playerIds);

            expect(result).toEqual(expectedResult);

            expect(mockGameStateRepository.save).toHaveBeenCalledWith(
                gameId,
                Fen.startingPosition,
                [player1, player2],
                0,
                NOW
            );
            expect(mockGameIdRepository.save).toHaveBeenCalledWith(player1.id, gameId);
            expect(mockGameIdRepository.save).toHaveBeenCalledWith(player2.id, gameId);
        });

        it('should throw error if less than 2 players are provided', async () => {
            const playerIds = ['1234'];

            await expect(gameService.create(playerIds)).rejects.toThrow(BadRequestError);
        });

        it('should throw error if more than 2 players are provided', async () => {
            const playerIds = ['1234', '5678', '9012'];

            await expect(gameService.create(playerIds)).rejects.toThrow(BadRequestError);
            await expect(gameService.create(playerIds)).rejects.toThrow('playerIds must be exactly 2 players');
        });

        it('should throw error if the same player is provided twice', async () => {
            const playerIds = ['1234', '1234'];

            await expect(gameService.create(playerIds)).rejects.toThrow(BadRequestError);
            await expect(gameService.create(playerIds)).rejects.toThrow('playerIds must be 2 distinct players');
        });

        it('should throw error if a player is already in an active game', async () => {
            const playerIds = ['1234', '5678'];
            mockGamesRepository.existsActiveGameByUserIds.mockResolvedValue(true);

            await expect(gameService.create(playerIds)).rejects.toThrow(ConflictError);
            await expect(gameService.create(playerIds)).rejects.toThrow('A player is already in game');
        });
    });

    describe('Get Game Id', () => {
        it('should return game id', async () => {
            const gameId = '0000';
            const userId = '1234';
            mockGameIdRepository.get.mockResolvedValue(gameId);

            const result = await gameService.getGameId(userId);

            expect(result).toEqual(gameId);
            expect(mockGameIdRepository.get).toHaveBeenCalledWith(userId);
        });
    });

    describe('Get Times', () => {
        it('should return player times when whites turn', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.turn.mockReturnValue(Color.WHITE);

            const result = await gameService.getTimes('1234', NOW);

            expect(result.whiteTimeRemaining).toEqual(500);
            expect(result.blackTimeRemaining).toEqual(2000);
        });

        it('should return player times when blacks turn', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.turn.mockReturnValue(Color.BLACK);

            const result = await gameService.getTimes('1234', NOW);

            expect(result.whiteTimeRemaining).toEqual(1000);
            expect(result.blackTimeRemaining).toEqual(1500);
        });

        it('should throw error if game not found', async () => {
            mockGameStateRepository.get.mockResolvedValue(null);
            await expect(gameService.getTimes('1234')).rejects.toThrow(NotFoundError);
        });
    });

    describe('Move', () => {
        it('should return correct fen on valid move and update game state', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.turn.mockReturnValue(Color.WHITE);

            const expected = 'newFen';
            mockGame.fen.mockReturnValue(expected);
            mockGame.move.mockReturnValue({ san: 'e3' });
            mockGame.moveNumber.mockReturnValue(1);

            const gameId = '0000';

            const expectedUpdatedPlayer1: Player = {
                id: player1.id,
                color: player1.color,
                timer: new Timer(player1.timer.remainingMs - elapsedTime)
            };
            const expectedUpdatedPlayer2: Player = {
                id: player2.id,
                color: player2.color,
                timer: new Timer(player2.timer.remainingMs)
            };

            const result = await gameService.move(player1.id, gameId, 'e2', 'e3', 'wQ', NOW);

            expect(result).toBe(expected);

            expect(mockGame.move).toHaveBeenCalledWith({
                from: 'e2',
                to: 'e3',
                promotion: 'wQ'
            });
            expect(mockGameStateRepository.save).toHaveBeenCalledWith(
                gameId,
                expected,
                [expectedUpdatedPlayer1, expectedUpdatedPlayer2],
                NOW,
                NOW
            );
        });

        it('should throw error if player is not part of game', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            await expect(gameService.move('missingId', '0000', 'e2', 'e3', 'wQ', NOW)).rejects.toThrow(ForbiddenError);
        });

        it('should throw error if not selected players turn', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);
            mockGame.turn.mockReturnValue(Color.BLACK);

            await expect(gameService.move(player1.id, '0000', 'e2', 'e3', 'wQ', NOW)).rejects.toThrow(ForbiddenError);
        });

        it('should throw error if game not found', async () => {
            mockGameStateRepository.get.mockResolvedValue(null);

            await expect(gameService.move('1234', 'missingId', 'e2', 'e3', 'wQ', NOW)).rejects.toThrow(NotFoundError);
        });
    });

    describe('Get Fen', () => {
        it('should return correct fen', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const expected = Fen.startingPosition;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: expected,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);
            mockGame.fen.mockReturnValue(expected);

            const result = await gameService.getFen('0000');

            expect(result).toBe(expected);

            expect(mockGame.fen).toHaveBeenCalled();
        });

        it('should throw error if game not found', async () => {
            mockGameStateRepository.get.mockResolvedValue(null);

            await expect(gameService.getFen('missingId')).rejects.toThrow(NotFoundError);
        });
    });

    describe('Is Game Over', () => {
        it('should return false if game is not in checkmate and timer did not expire', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.isGameOver.mockReturnValue(false);

            const result = await gameService.isGameOver('0000');

            expect(result).toBe(false);

            expect(mockGame.isGameOver).toHaveBeenCalled();
        });

        it('should return true if game is in checkmate', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.isGameOver.mockReturnValue(true);

            const result = await gameService.isGameOver('0000');

            expect(result).toBe(true);

            expect(mockGame.isGameOver).toHaveBeenCalled();
        });

        it('should return true if timer expired', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 0
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.isGameOver.mockReturnValue(false);

            const result = await gameService.isGameOver('0000');

            expect(result).toBe(true);

            expect(mockGame.isGameOver).toHaveBeenCalled();
        });

        it('should throw error if game not found', async () => {
            mockGameStateRepository.get.mockResolvedValue(null);

            await expect(gameService.isGameOver('missingId')).rejects.toThrow(NotFoundError);
        });
    });

    describe('Get Winner', () => {
        it('should return draw if game is drawn', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.isDraw.mockReturnValue(true);

            const result = await gameService.getWinner('0000');

            expect(result).toBe(Winner.DRAW);
        });

        it('should return winner if in checkmate', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.isDraw.mockReturnValue(false);
            mockGame.isCheckmate.mockReturnValue(true);
            mockGame.turn.mockReturnValue(Color.WHITE);

            const result = await gameService.getWinner('0000');

            expect(result).toBe(Winner.BLACK);
        });

        it('should return winner if timer expired', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 0
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            const result = await gameService.getWinner('0000');

            expect(result).toEqual(Winner.BLACK);
        });

        it('should return null if game is ongoing', async () => {
            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 2000
                }
            };
            const elapsedTime = 500;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - elapsedTime,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.isDraw.mockReturnValue(false);
            mockGame.isCheckmate.mockReturnValue(false);

            const result = await gameService.getWinner('0000');

            expect(result).toEqual(null);
        });

        it('should throw error if game not found', async () => {
            mockGameStateRepository.get.mockResolvedValue(null);

            await expect(gameService.getWinner('missingId')).rejects.toThrow(NotFoundError);
        });
    });

    describe('Reset Game', () => {
        it('should reset game', async () => {
            const gameId = '0000';
            const gameEntity = {
                id: gameId,
                blackPlayerId: '1234',
                whitePlayerId: '5678',
                startedAt: new Date(NOW),
                endedAt: null,
                winner: null
            };

            mockGamesRepository.findById.mockResolvedValue(gameEntity);

            const player1: StoredPlayer = {
                id: '1234',
                color: Color.WHITE,
                timer: {
                    remainingMs: 1000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 0
                }
            };
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.isDraw.mockReturnValue(false);
            mockGame.isCheckmate.mockReturnValue(false);

            await gameService.reset(gameId);

            expect(mockGamesRepository.findById).toHaveBeenCalledWith(gameId);
            expect(mockGamesRepository.update).toHaveBeenCalledWith({
                ...gameEntity,
                endedAt: new Date(NOW),
                winner: Winner.WHITE
            });
            expect(mockGameStateRepository.remove).toHaveBeenCalledWith(gameId);
            expect(mockGameIdRepository.remove).toHaveBeenCalledWith(gameId);
        });

        it('should throw error if game not found', async () => {
            const gameId = '0000';
            mockGamesRepository.findById.mockResolvedValue(null);

            await expect(gameService.reset(gameId)).rejects.toThrow('Game not found');
        });
    });

    describe('Get game state', () => {
        it('should return game state from repository if not cached', async () => {
            const player1Id = '1234';
            const plyaer1Color = Color.WHITE;
            const player1TimeRemaining = 1000;
            const player1: StoredPlayer = {
                id: player1Id,
                color: plyaer1Color,
                timer: {
                    remainingMs: player1TimeRemaining
                }
            };
            const player2Id = '5678';
            const player2Color = Color.BLACK;
            const player2TimeRemaining = 2000;
            const player2: StoredPlayer = {
                id: player2Id,
                color: player2Color,
                timer: {
                    remainingMs: player2TimeRemaining
                }
            };
            const fen = Fen.startingPosition;
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: fen,
                lastMoveEpoch: NOW,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            const expectedGameState: GameState = {
                players: [
                    {
                        id: player1Id,
                        color: plyaer1Color,
                        timer: new Timer(player1TimeRemaining)
                    },
                    {
                        id: player2Id,
                        color: player2Color,
                        timer: new Timer(player2TimeRemaining)
                    }
                ],
                game: new Chess(fen),
                lastMoveEpoch: NOW,
                startedAt: NOW
            };

            const gameId = '0000';

            const result = await gameService.getGameState(gameId);

            expect(result).toEqual(expectedGameState);
            expect(mockGameStateRepository.get).toHaveBeenCalledWith(gameId);
        });

        it('should return game state from memory if cached', async () => {
            const playerIds = ['1234', '5678'];

            const gameId = '0000';
            mockUuid.mockReturnValue(gameId);

            const player1: Player = {
                id: '1234',
                color: Color.WHITE,
                timer: new Timer()
            };

            const player2: Player = {
                id: '5678',
                color: Color.BLACK,
                timer: new Timer()
            };

            (Math.random as jest.Mock).mockReturnValue(0.6);

            const fen = Fen.startingPosition;
            mockGame.fen.mockReturnValue(fen);

            const expectedGameState: GameState = {
                game: new Chess(fen),
                players: [player1, player2],
                lastMoveEpoch: 0,
                startedAt: NOW
            };

            await gameService.create(playerIds);

            const result = await gameService.getGameState(gameId);

            expect(result).toEqual(expectedGameState);
            expect(mockGameStateRepository.get).not.toHaveBeenCalled();
        });
    });

    describe('Get Game History', () => {
        it('should return game history with games and total count', async () => {
            const userId = '1234';
            const mockGames = [
                {
                    id: 'game1',
                    whitePlayer: {
                        id: '5678',
                        name: 'White Player',
                        email: 'white@example.com',
                        elo: 1500,
                        avatarUrl: 'avatar_url.com'
                    },
                    blackPlayer: {
                        id: '1234',
                        name: 'Black Player',
                        email: 'black@example.com',
                        elo: 1600,
                        avatarUrl: 'avatar_url.com'
                    },
                    startedAt: new Date(NOW),
                    endedAt: new Date(NOW + 1000),
                    winner: Winner.WHITE
                },
                {
                    id: 'game2',
                    whitePlayer: {
                        id: '1234',
                        name: 'Black Player',
                        email: 'black@example.com',
                        elo: 1600,
                        avatarUrl: 'avatar_url.com'
                    },
                    blackPlayer: {
                        id: '5678',
                        name: 'White Player',
                        email: 'white@example.com',
                        elo: 1500,
                        avatarUrl: 'avatar_url.com'
                    },
                    startedAt: new Date(NOW + 2000),
                    endedAt: new Date(NOW + 3000),
                    winner: Winner.BLACK
                }
            ];
            const totalCount = 10;

            mockGamesRepository.findAllByUserId.mockResolvedValue(mockGames);
            mockGamesRepository.countAllByUserId.mockResolvedValue(totalCount);

            const result = await gameService.getGameHistory(userId, null, null);

            expect(result.games).toEqual(mockGames);
            expect(result.totalCount).toEqual(totalCount);
            expect(mockGamesRepository.findAllByUserId).toHaveBeenCalledWith(userId, null, null);
            expect(mockGamesRepository.countAllByUserId).toHaveBeenCalledWith(userId);
        });

        it('should return empty array when user has no games', async () => {
            const userId = '1234';
            mockGamesRepository.findAllByUserId.mockResolvedValue([]);
            mockGamesRepository.countAllByUserId.mockResolvedValue(0);

            const result = await gameService.getGameHistory(userId, null, null);

            expect(result.games).toEqual([]);
            expect(result.totalCount).toEqual(0);
        });

        it('should apply limit parameter correctly', async () => {
            const userId = '1234';
            const limit = 5;
            mockGamesRepository.findAllByUserId.mockResolvedValue([]);
            mockGamesRepository.countAllByUserId.mockResolvedValue(0);

            await gameService.getGameHistory(userId, limit, null);

            expect(mockGamesRepository.findAllByUserId).toHaveBeenCalledWith(userId, limit, null);
        });

        it('should apply offset parameter correctly', async () => {
            const userId = '1234';
            const offset = 10;
            mockGamesRepository.findAllByUserId.mockResolvedValue([]);
            mockGamesRepository.countAllByUserId.mockResolvedValue(0);

            await gameService.getGameHistory(userId, null, offset);

            expect(mockGamesRepository.findAllByUserId).toHaveBeenCalledWith(userId, null, offset);
        });

        it('should apply both limit and offset together', async () => {
            const userId = '1234';
            const limit = 5;
            const offset = 10;
            mockGamesRepository.findAllByUserId.mockResolvedValue([]);
            mockGamesRepository.countAllByUserId.mockResolvedValue(0);

            await gameService.getGameHistory(userId, limit, offset);

            expect(mockGamesRepository.findAllByUserId).toHaveBeenCalledWith(userId, limit, offset);
        });

        it('should handle null limit and offset', async () => {
            const userId = '1234';
            mockGamesRepository.findAllByUserId.mockResolvedValue([]);
            mockGamesRepository.countAllByUserId.mockResolvedValue(0);

            await gameService.getGameHistory(userId, null, null);

            expect(mockGamesRepository.findAllByUserId).toHaveBeenCalledWith(userId, null, null);
        });

        it('should throw BadRequestError when limit is negative', async () => {
            const userId = '1234';
            const limit = -5;

            await expect(gameService.getGameHistory(userId, limit, null)).rejects.toThrow(BadRequestError);
            await expect(gameService.getGameHistory(userId, limit, null)).rejects.toThrow(
                'Limit must be a non-negative number'
            );
        });

        it('should throw BadRequestError when offset is negative', async () => {
            const userId = '1234';
            const offset = -10;

            await expect(gameService.getGameHistory(userId, null, offset)).rejects.toThrow(BadRequestError);
            await expect(gameService.getGameHistory(userId, null, offset)).rejects.toThrow(
                'Offset must be a non-negative number'
            );
        });
    });

    describe('Get Game With Moves', () => {
        it('should return game with moves for valid completed game', async () => {
            const gameId = '550e8400-e29b-41d4-a716-446655440000';
            mockValidateUuid.mockReturnValue(true);

            const mockGameWithMoves = {
                id: gameId,
                whitePlayer: {
                    id: '5678',
                    name: 'White Player',
                    email: 'white@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                blackPlayer: {
                    id: '1234',
                    name: 'Black Player',
                    email: 'black@example.com',
                    elo: 1600,
                    avatarUrl: 'avatar_url.com'
                },
                startedAt: new Date(NOW),
                endedAt: new Date(NOW + 1000),
                winner: Winner.WHITE,
                moves: [
                    {
                        id: 'move1',
                        gameId: gameId,
                        moveNumber: 1,
                        playerColor: Color.WHITE,
                        moveNotation: 'e4',
                        positionFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                        whitePlayerTime: 600000,
                        blackPlayerTime: 600000,
                        createdAt: new Date(NOW)
                    }
                ]
            };

            mockGamesRepository.findByIdWithMoves.mockResolvedValue(mockGameWithMoves);

            const result = await gameService.getGameWithMoves(gameId);

            expect(result).toEqual(mockGameWithMoves);
            expect(mockGamesRepository.findByIdWithMoves).toHaveBeenCalledWith(gameId);
        });

        it('should throw BadRequestError for invalid UUID', async () => {
            const invalidGameId = 'invalid-uuid';
            mockValidateUuid.mockReturnValue(false);

            await expect(gameService.getGameWithMoves(invalidGameId)).rejects.toThrow(BadRequestError);
            await expect(gameService.getGameWithMoves(invalidGameId)).rejects.toThrow(
                `Invalid game with id ${invalidGameId}`
            );
        });

        it('should throw NotFoundError when game does not exist', async () => {
            const gameId = '550e8400-e29b-41d4-a716-446655440000';
            mockValidateUuid.mockReturnValue(true);
            mockGamesRepository.findByIdWithMoves.mockResolvedValue(null);

            await expect(gameService.getGameWithMoves(gameId)).rejects.toThrow(NotFoundError);
            await expect(gameService.getGameWithMoves(gameId)).rejects.toThrow(`Game with id ${gameId} not found`);
        });

        it('should throw BadRequestError when game is still in progress', async () => {
            const gameId = '550e8400-e29b-41d4-a716-446655440000';
            mockValidateUuid.mockReturnValue(true);

            const mockGameInProgress = {
                id: gameId,
                whitePlayer: {
                    id: '5678',
                    name: 'White Player',
                    email: 'white@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                blackPlayer: {
                    id: '1234',
                    name: 'Black Player',
                    email: 'black@example.com',
                    elo: 1600,
                    avatarUrl: 'avatar_url.com'
                },
                startedAt: new Date(NOW),
                endedAt: null,
                winner: null,
                moves: []
            };

            mockGamesRepository.findByIdWithMoves.mockResolvedValue(mockGameInProgress);

            await expect(gameService.getGameWithMoves(gameId)).rejects.toThrow(BadRequestError);
            await expect(gameService.getGameWithMoves(gameId)).rejects.toThrow(
                `Game with id ${gameId} is still in progress`
            );
        });
    });

    describe('Get Active Game', () => {
        it('should return active game with position, times, and status for ongoing game', async () => {
            const userId = '1234';
            const gameId = '0000';
            const mockGameWithPlayers = {
                id: gameId,
                whitePlayer: {
                    id: userId,
                    name: 'White Player',
                    email: 'white@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                blackPlayer: {
                    id: '5678',
                    name: 'Black Player',
                    email: 'black@example.com',
                    elo: 1600,
                    avatarUrl: 'avatar_url.com'
                },
                startedAt: new Date(NOW),
                endedAt: null,
                winner: null
            };

            mockGamesRepository.findActiveGameByUserId.mockResolvedValue(mockGameWithPlayers);

            const player1: StoredPlayer = {
                id: userId,
                color: Color.WHITE,
                timer: {
                    remainingMs: 100000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 200000
                }
            };
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - 5000,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.fen.mockReturnValue(Fen.startingPosition);
            mockGame.turn.mockReturnValue(Color.WHITE);
            mockGame.isGameOver.mockReturnValue(false);

            const result = await gameService.getActiveGame(userId);

            expect(result.game).toEqual(mockGameWithPlayers);
            expect(result.position).toEqual(Fen.startingPosition);
            expect(result.whiteTimeRemaining).toEqual(95000);
            expect(result.blackTimeRemaining).toEqual(200000);
            expect(result.gameOver).toBe(false);
            expect(result.winner).toBeNull();
            expect(mockGamesRepository.findActiveGameByUserId).toHaveBeenCalledWith(userId);
        });

        it('should return active game with winner when game is over', async () => {
            const userId = '1234';
            const gameId = '0000';
            const mockGameWithPlayers = {
                id: gameId,
                whitePlayer: {
                    id: userId,
                    name: 'White Player',
                    email: 'white@example.com',
                    elo: 1500,
                    avatarUrl: 'avatar_url.com'
                },
                blackPlayer: {
                    id: '5678',
                    name: 'Black Player',
                    email: 'black@example.com',
                    elo: 1600,
                    avatarUrl: 'avatar_url.com'
                },
                startedAt: new Date(NOW),
                endedAt: null,
                winner: null
            };

            mockGamesRepository.findActiveGameByUserId.mockResolvedValue(mockGameWithPlayers);

            const player1: StoredPlayer = {
                id: userId,
                color: Color.WHITE,
                timer: {
                    remainingMs: 100000
                }
            };
            const player2: StoredPlayer = {
                id: '5678',
                color: Color.BLACK,
                timer: {
                    remainingMs: 200000
                }
            };
            const storedGameState: StoredGameState = {
                players: [player1, player2],
                position: Fen.startingPosition,
                lastMoveEpoch: NOW - 5000,
                startedAt: NOW
            };
            mockGameStateRepository.get.mockResolvedValue(storedGameState);

            mockGame.fen.mockReturnValue(Fen.startingPosition);
            mockGame.turn.mockReturnValue(Color.WHITE);
            mockGame.isGameOver.mockReturnValue(true);
            mockGame.isDraw.mockReturnValue(false);
            mockGame.isCheckmate.mockReturnValue(true);

            const result = await gameService.getActiveGame(userId);

            expect(result.game).toEqual(mockGameWithPlayers);
            expect(result.gameOver).toBe(true);
            expect(result.winner).toEqual(Winner.BLACK);
        });

        it('should throw NotFoundError when no active game found for user', async () => {
            const userId = '1234';
            mockGamesRepository.findActiveGameByUserId.mockResolvedValue(null);

            await expect(gameService.getActiveGame(userId)).rejects.toThrow(NotFoundError);
            await expect(gameService.getActiveGame(userId)).rejects.toThrow('No active game found for user');
        });
    });
});
