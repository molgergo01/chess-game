import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFallbackNameAvatar } from '@/lib/utils/name.utils';

interface LeaderboardPlayerCellProps {
    playerName: string;
    playerAvatarUrl: string | null;
}

export function LeaderboardPlayerCell({ playerName, playerAvatarUrl }: LeaderboardPlayerCellProps) {
    return (
        <div className="flex flex-row items-center gap-2" data-cy="leaderboard-player-cell">
            <Avatar className="size-10 flex-shrink-0 border-2" data-cy="leaderboard-white-avatar">
                <AvatarImage src={playerAvatarUrl || ''} />
                <AvatarFallback className={'text-foreground'}>{getFallbackNameAvatar(playerName)}</AvatarFallback>
            </Avatar>
            <span className="truncate max-w-24 sm:max-w-52">{playerName}</span>
        </div>
    );
}
