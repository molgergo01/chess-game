export function getFallbackNameAvatar(name: string): string {
    if (name.length === 0) {
        return '?';
    } else {
        return name.charAt(0).toUpperCase();
    }
}
