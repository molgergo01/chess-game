import { Server, Socket } from 'socket.io';
import container from '../config/container';
import { SetUserIdRequest } from '../models/matchmaking';
import MatchmakingService from '../services/matchmaking.service';

const matchmakingService = container.get(MatchmakingService);

const matchmakingListener = (io: Server, socket: Socket) => {
    const setSocketIdForUser = function (request: SetUserIdRequest) {
        matchmakingService.setSocketIdForUser(request.userId, socket.id);
    };

    return {
        setSocketIdForUser
    };
};

export default matchmakingListener;
