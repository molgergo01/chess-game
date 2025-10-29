import { GameHistory, GameWithMoves } from '@/lib/models/history/history';
import axios, { AxiosError, AxiosResponse } from 'axios';
import env from '@/lib/config/env';
import {
    GameDto,
    GetActiveGameResponse,
    GetGameHistoryResponse,
    GetGameResponse,
    GetLeaderboardResponse
} from '@/lib/models/response/game';
import { GetGameHistoryParams, GetLeaderboardParams } from '@/lib/models/request/game';
import { PlayerLeaderboard } from '@/lib/models/leaderboard/playerLeaderboard';

export async function getGameHistory(
    userId: string,
    limit: number | null,
    offset: number | null
): Promise<GameHistory> {
    try {
        const params: GetGameHistoryParams = {
            userId: userId,
            limit: limit,
            offset: offset
        };
        const response: AxiosResponse<GetGameHistoryResponse> = await axios.get(`${env.REST_URLS.CORE}/api/games`, {
            params: params
        });
        return {
            games: response.data.games.map((game: GameDto) => ({
                gameId: game.gameId,
                whitePlayer: {
                    userId: game.whitePlayer.userId,
                    name: game.whitePlayer.name,
                    elo: game.whitePlayer.elo,
                    avatarUrl: game.whitePlayer.avatarUrl
                },
                blackPlayer: {
                    userId: game.blackPlayer.userId,
                    name: game.blackPlayer.name,
                    elo: game.blackPlayer.elo,
                    avatarUrl: game.blackPlayer.avatarUrl
                },
                startedAt: game.startedAt,
                winner: game.winner
            })),
            totalCount: response.data.totalCount
        };
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to get game history');
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to core service');
        } else {
            throw new Error('Failed to get game history');
        }
    }
}

export async function getGame(gameId: string): Promise<GameWithMoves> {
    try {
        const response: AxiosResponse<GetGameResponse> = await axios.get(`${env.REST_URLS.CORE}/api/games/${gameId}`);
        return {
            gameId: response.data.gameId,
            whitePlayer: {
                userId: response.data.whitePlayer.userId,
                name: response.data.whitePlayer.name,
                elo: response.data.whitePlayer.elo,
                avatarUrl: response.data.whitePlayer.avatarUrl
            },
            blackPlayer: {
                userId: response.data.blackPlayer.userId,
                name: response.data.blackPlayer.name,
                elo: response.data.blackPlayer.elo,
                avatarUrl: response.data.blackPlayer.avatarUrl
            },
            startedAt: response.data.startedAt,
            winner: response.data.winner,
            moves: response.data.moves.map((move) => ({
                moveNumber: move.moveNumber,
                moveNotation: move.moveNotation,
                whitePlayerTime: move.whitePlayerTime,
                blackPlayerTime: move.blackPlayerTime,
                positionFen: move.positionFen,
                playerColor: move.playerColor
            }))
        };
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            const errorWithStatus = new Error(error.response.data.message || 'Failed to get game') as Error & {
                status?: number;
            };
            errorWithStatus.status = error.response.status;
            throw errorWithStatus;
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to core service');
        } else {
            throw new Error('Failed to get game');
        }
    }
}

export async function getPlayerLeaderboard(limit: number | null, offset: number | null): Promise<PlayerLeaderboard> {
    try {
        const params: GetLeaderboardParams = {
            limit: limit,
            offset: offset
        };
        const response: AxiosResponse<GetLeaderboardResponse> = await axios.get(
            `${env.REST_URLS.CORE}/api/leaderboard`,
            {
                params: params
            }
        );

        const users = response.data.users.map((user) => ({
            userId: user.userId,
            rank: user.rank,
            name: user.name,
            elo: user.elo,
            avatarUrl: user.avatarUrl
        }));

        return {
            users: users,
            totalCount: response.data.totalCount
        };
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to get leaderboard');
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to core service');
        } else {
            throw new Error('Failed to get leaderboard');
        }
    }
}

export async function getActiveGame(userId: string): Promise<GetActiveGameResponse> {
    try {
        const response: AxiosResponse<GetActiveGameResponse> = await axios.get(
            `${env.REST_URLS.CORE}/api/games/active`,
            {
                params: { userId }
            }
        );
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to get active game');
        } else if (error instanceof AxiosError && error.request) {
            throw new Error('Network error: Unable to connect to core service');
        } else {
            throw new Error('Failed to get active game');
        }
    }
}
