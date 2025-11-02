import { getColorString } from '../../src/utils/color.utils';
import { Color } from '../../src/models/game';

describe('Color Utils', () => {
    describe('getColorString', () => {
        it('should return "white" for Color.WHITE', () => {
            expect(getColorString(Color.WHITE)).toBe('white');
        });

        it('should return "black" for Color.BLACK', () => {
            expect(getColorString(Color.BLACK)).toBe('black');
        });
    });
});
