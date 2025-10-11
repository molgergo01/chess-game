import { formatDate } from '@/lib/utils/date.utils';

describe('formatDate', () => {
    it('formats a date correctly with single digit month', () => {
        const date = new Date('2024-03-15');
        const result = formatDate(date);
        expect(result).toBe('2024-03-15');
    });
    it('formats a date correctly with single digit day', () => {
        const date = new Date('2024-03-05');
        const result = formatDate(date);
        expect(result).toBe('2024-03-05');
    });
    it('formats a date correctly with double digit month and day', () => {
        const date = new Date('2024-12-15');
        const result = formatDate(date);
        expect(result).toBe('2024-12-15');
    });
});
