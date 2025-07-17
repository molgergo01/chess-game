import { Color } from '@/lib/models/request/matchmaking';

export function getCurrentUserColor(userId: string): Color {
    const playerDataString = localStorage.getItem('playerData');
    if (!playerDataString) throw new Error('playerData not set');

    const playerData = JSON.parse(playerDataString);

    return playerData[userId] === 'w'
        ? Color.WHITE
        : playerData[userId] === 'b'
          ? Color.BLACK
          : (() => {
                throw new Error('Invalid color in playerData');
            })();
}
