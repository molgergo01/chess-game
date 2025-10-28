import { formatTime } from '@/lib/utils/time.utils';

describe('formatTime', () => {
    it('formats time correctly', () => {
        const result = formatTime(75000);
        expect(result).toBe('01:15');
    });

    it('should round seconds up', () => {
        const result = formatTime(1);
        expect(result).toBe('00:01');
    });
});
