import { getCurrentUserColor } from '@/lib/utils/game.utils';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import { UserDto } from '@/lib/models/response/game';

describe('getCurrentUserColor', () => {
    const whitePlayer: UserDto = {
        userId: 'user123',
        name: 'White Player',
        elo: 1500,
        avatarUrl: null
    };

    const blackPlayer: UserDto = {
        userId: 'user456',
        name: 'Black Player',
        elo: 1600,
        avatarUrl: null
    };

    describe('when user is white player', () => {
        it('should return MatchmakingColor.WHITE', () => {
            const result = getCurrentUserColor('user123', whitePlayer, blackPlayer);
            expect(result).toBe(MatchmakingColor.WHITE);
        });
    });

    describe('when user is black player', () => {
        it('should return MatchmakingColor.BLACK', () => {
            const result = getCurrentUserColor('user456', whitePlayer, blackPlayer);
            expect(result).toBe(MatchmakingColor.BLACK);
        });
    });

    describe('when user is not part of the game', () => {
        it('should throw an error', () => {
            expect(() => getCurrentUserColor('user789', whitePlayer, blackPlayer)).toThrow(
                'User is not part of this game'
            );
        });
    });
});
