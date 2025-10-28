import MatchmakingNotificationService from '../../src/services/matchmaking.notification.service';
import { Server } from 'socket.io';
import { Container } from 'inversify';
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

        matchmakingNotificationService = new MatchmakingNotificationService(mockContainer);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('Send Matchmake Notification', () => {
        const matchmakeEvent = 'matchmake';

        it('should send notification to socket with correct message', () => {
            const socketId = 'socket-1234';
            const gameId = 'game-0000';

            const expectedMessage: MatchmakeMessage = {
                gameId: gameId
            };

            matchmakingNotificationService.sendMatchmakeNotification(socketId, gameId);

            expect(mockIo.to).toHaveBeenCalledWith(socketId);
            expect(mockIo.emit).toHaveBeenCalledWith(matchmakeEvent, expectedMessage);
        });
    });
});
