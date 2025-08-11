import { Color, Player } from '@/lib/models/request/matchmaking';

export function getCurrentUserColor(userId: string): Color {
    const playerDataString = localStorage.getItem('playerData');
    if (!playerDataString) throw new Error('playerData not set');

    const playerData: Array<Player> = JSON.parse(playerDataString);
    const currentPlayer = playerData.filter(
        (player: Player) => player.id === userId
    )[0];

    return currentPlayer.color === 'w'
        ? Color.WHITE
        : currentPlayer.color === 'b'
          ? Color.BLACK
          : (() => {
                throw new Error('Invalid color in playerData');
            })();
}
