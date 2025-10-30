import MatchmakingNotificationService from '../../src/services/matchmaking.notification.service';
import { Server } from 'socket.io';
import { Container } from 'inversify';

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

        it('should send notification to socket', () => {
            const socketId = 'socket-1234';

            matchmakingNotificationService.sendMatchmakeNotification(socketId);

            expect(mockIo.to).toHaveBeenCalledWith(socketId);
            expect(mockIo.emit).toHaveBeenCalledWith(matchmakeEvent);
        });
    });
});
