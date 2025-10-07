import { TimeDisplay } from '@/components/game/banner/timer';
import { Color } from '@/lib/models/request/matchmaking';
import { cn } from '@/lib/utils/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface BannerProps extends React.ComponentProps<'div'> {
    playerColor: Color;
    isOpponent: boolean;
    turnColor: Color | undefined;
    timeLeft: number;
    playerName?: string;
    elo?: number;
    avatarUrl?: string;
}

function Banner({
    className,
    playerColor,
    isOpponent,
    turnColor,
    timeLeft,
    playerName = 'Player13123',
    elo = 1234,
    avatarUrl = 'https://github.com/shadcn.png',
    ...props
}: BannerProps) {
    return (
        <div
            className={cn(
                'flex gap-5 flex-row items-center min-w-0 p-3 sm:grid sm:grid-cols-[minmax(auto,100px)_1fr_minmax(auto,100px)] sm:gap-4',
                className,
                isOpponent ? 'flex-row-reverse sm:flex-row' : 'flex-row',
                turnColor == playerColor ? 'bg-foreground text-background' : ''
            )}
            data-cy="banner"
            {...props}
        >
            <div className={cn('flex flex-col justify-center shrink-0 items-center')}>
                <Avatar className="size-12 flex-shrink-0 border-2" data-cy="banner-avatar">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <span className="text-center text-base sm:text-sm" data-cy="banner-player-color">
                    {playerColor}
                </span>
            </div>
            <div
                className={cn(
                    'flex flex-col min-w-0 justify-center flex-1',
                    isOpponent ? 'items-start sm:items-center' : 'items-end sm:items-center'
                )}
            >
                <span
                    className={cn(
                        'truncate text-sm sm:text-lg max-w-full sm:text-center',
                        isOpponent ? 'text-left' : 'text-right'
                    )}
                    data-cy="banner-player-name"
                >
                    {playerName}
                </span>
                <span
                    className={cn('text-xs sm:text-base sm:text-center', isOpponent ? 'text-left' : 'text-right')}
                    data-cy="banner-elo"
                >
                    {elo}
                </span>
                <TimeDisplay timeLeft={timeLeft} className="text-sm sm:hidden" data-cy="banner-time-mobile" />
            </div>
            <div className="hidden sm:flex sm:flex-col sm:items-end sm:justify-center">
                <TimeDisplay timeLeft={timeLeft} className="text-sm sm:text-xl" data-cy="banner-time-desktop" />
            </div>
        </div>
    );
}

export default Banner;
