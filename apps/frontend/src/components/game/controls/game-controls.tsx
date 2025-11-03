import ResignButton from '@/components/game/controls/resign-button';
import DrawButton from '@/components/game/controls/draw-button';
import AcceptDrawButton from '@/components/game/controls/accept-draw-button';
import DeclineDrawButton from '@/components/game/controls/decline-draw-button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import { DrawOffer } from '@/lib/models/request/game';
import { Color } from '@/lib/models/history/history';

interface GameControlsProps {
    gameId: string;
    color: MatchmakingColor;
    drawOffer: DrawOffer | undefined;
    gameStarted: boolean;
}

function getMatchmakingColor(color: Color): MatchmakingColor {
    return color === Color.BLACK ? MatchmakingColor.BLACK : MatchmakingColor.WHITE;
}

function GameControls({ gameId, color, drawOffer, gameStarted }: GameControlsProps) {
    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-row gap-2 p-2 rounded-lg border bg-background shadow-md" data-cy="game-controls">
                {drawOffer && getMatchmakingColor(drawOffer.offeredBy) !== color ? (
                    <>
                        <AcceptDrawButton gameId={gameId} />
                        <DeclineDrawButton gameId={gameId} />
                    </>
                ) : (
                    <>
                        <ResignButton gameId={gameId} gameStarted={gameStarted} />
                        <DrawButton
                            gameId={gameId}
                            gameStarted={gameStarted}
                            disabled={!!(drawOffer && getMatchmakingColor(drawOffer.offeredBy) === color)}
                        />
                    </>
                )}
            </div>
        </TooltipProvider>
    );
}

export default GameControls;
