import Timer, { TimerRef } from '@/components/game/banner/timer';
import { Color } from '@/lib/models/request/matchmaking';

interface BannerProps extends React.ComponentProps<'div'> {
    playerColor: Color;
    isOpponent: boolean;
    timerRef: React.RefObject<TimerRef | null>;
}

function Banner({
    className,
    playerColor,
    isOpponent,
    timerRef,
    ...props
}: BannerProps) {
    return (
        <div className={className} {...props}>
            <div>
                {playerColor === Color.WHITE ? 'White' : 'Black'}{' '}
                {isOpponent ? '(Opponent)' : '(You)'}
            </div>
            <Timer ref={timerRef} timeInMinutes={10} />
        </div>
    );
}

export default Banner;
