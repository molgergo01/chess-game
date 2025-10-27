import { cn } from '@/lib/utils/utils';

describe('cn', () => {
    it('returns a single class when one class is provided', () => {
        const result = cn('bg-red-500');
        expect(result).toBe('bg-red-500');
    });

    it('merges multiple classes correctly', () => {
        const result = cn('bg-red-500', 'text-white');
        expect(result).toBe('bg-red-500 text-white');
    });

    it('removes duplicate classes', () => {
        const result = cn('bg-red-500', 'bg-red-500', 'text-white');
        expect(result).toBe('bg-red-500 text-white');
    });

    it('returns an empty string when no classes are provided', () => {
        const result = cn();
        expect(result).toBe('');
    });

    it('handles undefined and null values gracefully', () => {
        const result = cn('bg-red-500', undefined, null, 'text-white');
        expect(result).toBe('bg-red-500 text-white');
    });

    it('handles empty strings correctly', () => {
        const result = cn('bg-red-500', '', 'text-white');
        expect(result).toBe('bg-red-500 text-white');
    });
});
