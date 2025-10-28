import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import { UserDto } from '@/lib/models/response/game';

export function getCurrentUserColor(userId: string, whitePlayer: UserDto, blackPlayer: UserDto): MatchmakingColor {
    if (whitePlayer.userId === userId) {
        return MatchmakingColor.WHITE;
    } else if (blackPlayer.userId === userId) {
        return MatchmakingColor.BLACK;
    } else {
        throw new Error('User is not part of this game');
    }
}
