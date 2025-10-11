import { formatTime } from '@/lib/utils/time.utils';

describe('formatTime', () => {
    it('formats time correctly', () => {
        const result = formatTime(75000);
        expect(result).toBe('01:15');
    });
});
