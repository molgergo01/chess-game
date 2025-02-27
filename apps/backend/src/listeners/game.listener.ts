import { Server, Socket } from 'socket.io';
import { move } from '../services/game.service';

const gameListener = (io: Server, socket: Socket) => {
    const movePiece = function ({
        gameId,
        from,
        to
    }: {
        gameId: string;
        from: string;
        to: string;
    }) {
        try {
            move(gameId, from, to);
        } catch (e) {
            console.log(e);
            socket.emit('movePiece', 'Illegal move');
            return;
        }
        socket.emit('movePiece', 'Successful move');
    };

    return { movePiece };
};

export default gameListener;
