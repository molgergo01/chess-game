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
        const response = await axios.post(`http://localhost:${env.PORTS.CORE}/api/game`, requestBody);
        return response.data as CreateGameResponse;
    }
}

export default CoreRestClient;
