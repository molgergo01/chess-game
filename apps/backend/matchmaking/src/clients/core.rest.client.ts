import { injectable } from 'inversify';
import axios from 'axios';
import env from 'chess-game-backend-common/config/env';
import { CreateGameRequest, CreateGameResponse } from '../models/game';

@injectable()
class CoreRestClient {
    async createGame(players: string[]) {
        const requestBody: CreateGameRequest = {
            players: players
        };
        const response = await axios.post(`${env.URLS.CORE}/internal/games`, requestBody);
        return response.data as CreateGameResponse;
    }

    async checkActiveGame(userId: string): Promise<boolean> {
        try {
            await axios.get(`${env.URLS.CORE}/internal/games/active`, {
                params: { userId }
            });
            return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                return false;
            }
            throw error;
        }
    }
}

export default CoreRestClient;
