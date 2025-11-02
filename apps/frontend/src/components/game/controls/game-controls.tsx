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
    onError?: (error: Error) => void;
    onClickMessage?: (message: string) => void;
}

function getMatchmakingColor(color: Color): MatchmakingColor {
    return color === Color.BLACK ? MatchmakingColor.BLACK : MatchmakingColor.WHITE;
}

function GameControls({ gameId, color, drawOffer, gameStarted, onError, onClickMessage }: GameControlsProps) {
    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-row gap-2 p-2 rounded-lg border bg-background shadow-md" data-cy="game-controls">
                {drawOffer && getMatchmakingColor(drawOffer.offeredBy) !== color ? (
                    <>
                        <AcceptDrawButton
                            gameId={gameId}
                            color={color}
                            onError={onError}
                            onClickMessage={onClickMessage}
                        />
                        <DeclineDrawButton
                            gameId={gameId}
                            color={color}
                            onError={onError}
                            onClickMessage={onClickMessage}
                        />
                    </>
                ) : (
                    <>
                        <ResignButton
                            gameId={gameId}
                            color={color}
                            gameStarted={gameStarted}
                            onError={onError}
                            onClickMessage={onClickMessage}
                        />
                        <DrawButton
                            gameId={gameId}
                            color={color}
                            gameStarted={gameStarted}
                            disabled={!!(drawOffer && getMatchmakingColor(drawOffer.offeredBy) === color)}
                            onError={onError}
                            onClickMessage={onClickMessage}
                        />
                    </>
                )}
            </div>
        </TooltipProvider>
    );
}

export default GameControls;
