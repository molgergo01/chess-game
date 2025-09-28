import MatchmakingNotificationService from '../../src/services/matchmaking.notification.service';
import { Server } from 'socket.io';
import { Container } from 'inversify';
import { Player } from '../../src/models/game';
import { Color } from '../../src/models/game';
import { MatchmakeMessage } from '../../src/models/matchmaking';

jest.mock('socket.io');

describe('Matchmaking Notification Service', () => {
    let mockContainer: jest.Mocked<Container>;
    let mockIo: jest.Mocked<Server>;
    let matchmakingNotificationService: MatchmakingNotificationService;

    beforeEach(() => {
        mockIo = new Server() as jest.Mocked<Server>;
        mockIo.to = jest.fn().mockReturnThis();
        mockIo.emit = jest.fn().mockReturnThis();

        mockContainer = new Container() as jest.Mocked<Container>;
        mockContainer.get = jest.fn().mockReturnValue(mockIo);

        matchmakingNotificationService = new MatchmakingNotificationService(
            mockContainer
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('Send Matchmake Notification', () => {
        const matchmakeEvent = 'matchmake';

        it('should send notification to socket with correct message', () => {
            const socketId = 'socket-1234';
            const player1: Player = {
                id: '1234',
                color: Color.WHITE,
                timer: { remainingMs: 600000 }
            };
            const player2: Player = {
                id: '5678',
                color: Color.BLACK,
                timer: { remainingMs: 600000 }
            };
            const players = [player1, player2];
            const gameId = 'game-0000';

            const expectedMessage: MatchmakeMessage = {
                players: players,
                gameId: gameId
            };

            matchmakingNotificationService.sendMatchmakeNotification(
                socketId,
                players,
                gameId
            );

            expect(mockIo.to).toHaveBeenCalledWith(socketId);
            expect(mockIo.emit).toHaveBeenCalledWith(
                matchmakeEvent,
                expectedMessage
            );
        });
    });
});
