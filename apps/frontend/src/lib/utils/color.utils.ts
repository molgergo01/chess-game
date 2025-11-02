import { MatchmakingColor } from '@/lib/models/request/matchmaking';

export function getColorString(color: MatchmakingColor) {
    switch (color) {
        case MatchmakingColor.BLACK:
            return 'black';
        case MatchmakingColor.WHITE:
            return 'white';
    }
}
