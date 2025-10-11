import { GameHistory, GameWithMoves } from '@/lib/models/history/history';
import axios, { AxiosError, AxiosResponse } from 'axios';
import env from '@/lib/config/env';
import { GameDto, GetGameHistoryResponse, GetGameResponse } from '@/lib/models/response/game';
import { GetGameHistoryParams } from '@/lib/models/request/game';

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
                    elo: game.whitePlayer.elo
                },
                blackPlayer: {
                    userId: game.blackPlayer.userId,
                    name: game.blackPlayer.name,
                    elo: game.blackPlayer.elo
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
                elo: response.data.whitePlayer.elo
            },
            blackPlayer: {
                userId: response.data.blackPlayer.userId,
                name: response.data.blackPlayer.name,
                elo: response.data.blackPlayer.elo
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
