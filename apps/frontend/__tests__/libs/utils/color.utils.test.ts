import { getColorString } from '@/lib/utils/color.utils';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';

describe('Color Utils', () => {
    describe('getColorString', () => {
        it('should return "white" for MatchmakingColor.WHITE', () => {
            expect(getColorString(MatchmakingColor.WHITE)).toBe('white');
        });

        it('should return "black" for MatchmakingColor.BLACK', () => {
            expect(getColorString(MatchmakingColor.BLACK)).toBe('black');
        });
    });
});
