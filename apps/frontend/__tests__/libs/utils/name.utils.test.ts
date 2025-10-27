import { getFallbackNameAvatar } from '@/lib/utils/name.utils';

describe('getFallbackNameAvatar', () => {
    it('should return ? when name is empty', () => {
        const result = getFallbackNameAvatar('');
        expect(result).toEqual('?');
    });
    it('should return capital initial if name is not empty', () => {
        const result = getFallbackNameAvatar('name');
        expect(result).toEqual('N');
    });
});
