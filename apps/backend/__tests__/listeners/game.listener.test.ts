import { createServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { Server, type Socket as ServerSocket } from 'socket.io';
import { onConnection } from '../../src/server';
import * as gameService from '../../src/services/game.service';
import { MoveCallback, PositionCallback } from '../../src/models/game';

jest.mock('../../src/services/game.service', () => ({
    getFen: jest.fn(() => 'current_fen'),
    getWinner: jest.fn(() => null),
    isGameOver: jest.fn(() => false),
    move: jest.fn(() => 'new_fen'),
    reset: jest.fn()
}));

describe('game listener', () => {
    let io: Server, clientSocket: ClientSocket;

    beforeAll((done) => {
        const httpServer = createServer();
        io = new Server(httpServer);
        httpServer.listen(() => {
            const port = (httpServer.address() as AddressInfo).port;
            clientSocket = ioc(`http://localhost:${port}`);
            io.on('connection', (socket: ServerSocket) => {
                onConnection(socket);
            });
            clientSocket.on('connect', done);
        });
    });

    afterAll(() => {
        io.close();
        clientSocket.disconnect();
    });

    describe('movePiece', () => {
        it('should return response with new fen when move was successful', async () => {
            const expectedResponse = {
                success: true,
                position: 'new_fen',
                gameOver: false,
                winner: null
            };

            const result: MoveCallback = await clientSocket.emitWithAck(
                'movePiece',
                {
                    from: 'e2',
                    to: 'e3',
                    gameId: '1',
                    promotionPiece: 'wQ'
                }
            );

            expect(result).toEqual(expectedResponse);

            expect(gameService.move).toHaveBeenCalledWith(
                '1',
                'e2',
                'e3',
                'wQ'
            );
        });

        it('should return unsuccessful response with current fen when move was not successful', async () => {
            (gameService.move as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Invalid move');
            });

            const expectedResponse = {
                success: false,
                position: 'current_fen',
                gameOver: false,
                winner: null
            };

            const result: MoveCallback = await clientSocket.emitWithAck(
                'movePiece',
                {
                    from: 'e2',
                    to: 'e5',
                    gameId: '1',
                    promotionPiece: 'wQ'
                }
            );

            expect(result).toEqual(expectedResponse);

            expect(gameService.move).toHaveBeenCalledWith(
                '1',
                'e2',
                'e5',
                'wQ'
            );
        });
    });

    describe('getPosition', () => {
        it('should return current fen', async () => {
            const expectedResponse = {
                position: 'current_fen',
                gameOver: false,
                winner: null
            };

            const result: PositionCallback = await clientSocket.emitWithAck(
                'getPosition',
                {
                    gameId: '1'
                }
            );

            expect(result).toEqual(expectedResponse);

            expect(gameService.getFen).toHaveBeenCalled();
        });
    });

    describe('resetGame', () => {
        it('should reset game', async () => {
            clientSocket.emit('resetGame');

            await new Promise((resolve) => setTimeout(resolve, 1000));

            expect(gameService.reset).toHaveBeenCalled();
        });
    });
});
