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
        const response = await axios.post(`http://localhost:${env.PORTS.CORE}/api/games`, requestBody);
        return response.data as CreateGameResponse;
    }

    async checkActiveGame(userId: string): Promise<boolean> {
        try {
            await axios.get(`http://localhost:${env.PORTS.CORE}/api/games/active`, {
                params: { userId }
            });
            return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                console.log(error);
                return false;
            }
            throw error;
        }
    }
}

export default CoreRestClient;
