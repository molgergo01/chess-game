'use client';

import { useState } from 'react';
import { Color, GameWithMoves } from '@/lib/models/history/history';
import ChessboardWithBanners from '@/components/ui/chessboard-with-banners';
import HistoryDetails from '@/components/history/history-details';
import Fen from 'chess-fen';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';

interface GameHistoryParams {
    game: GameWithMoves;
}

function GameHistory({ game }: GameHistoryParams) {
    const [currentMoveIndex, setCurrentMoveIndex] = useState(game.moves.length - 1);

    const handleMoveSelect = (index: number) => {
        setCurrentMoveIndex(index);
    };

    const currentPosition = currentMoveIndex === -1 ? Fen.startingPosition : game.moves[currentMoveIndex].positionFen;

    const currentTurnColor =
        currentMoveIndex === game.moves.length - 1 ? undefined : game.moves[currentMoveIndex + 1].playerColor;

    const whitePlayerInfo = {
        name: game.whitePlayer.name,
        elo: game.whitePlayer.elo,
        avatarUrl: game.whitePlayer.avatarUrl
    };

    const blackPlayerInfo = {
        name: game.blackPlayer.name,
        elo: game.blackPlayer.elo,
        avatarUrl: game.blackPlayer.avatarUrl
    };

    const currentWhiteTime =
        currentMoveIndex === -1 ? getStartTime(game) : game.moves[currentMoveIndex].whitePlayerTime;
    const currentBlackTime =
        currentMoveIndex === -1 ? getStartTime(game) : game.moves[currentMoveIndex].blackPlayerTime;

    function getStartTime(game: GameWithMoves): number {
        const startTime = game.moves.find(
            (move) => move.moveNumber === 1 && move.playerColor === Color.WHITE
        )?.blackPlayerTime;
        if (!startTime) {
            return 10 * 60 * 1000;
        } else {
            return startTime;
        }
    }

    function getMatchmakingColor(color: Color): MatchmakingColor {
        return color === Color.BLACK ? MatchmakingColor.BLACK : MatchmakingColor.WHITE;
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 h-screen" data-cy="game-history-container">
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto sm:overflow-visible sm:items-center sm:justify-center sm:p-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full h-full min-h-0 aspect-square sm:aspect-auto sm:w-auto sm:h-auto sm:max-w-[90vw] sm:items-start sm:gap-2">
                    <div className="flex flex-col sm:gap-1 flex-shrink-0">
                        <ChessboardWithBanners
                            boardPosition={currentPosition}
                            boardOrientation={MatchmakingColor.WHITE}
                            turnColor={currentTurnColor ? getMatchmakingColor(currentTurnColor) : undefined}
                            whitePlayerInfo={whitePlayerInfo}
                            blackPlayerInfo={blackPlayerInfo}
                            whiteTimeLeft={currentWhiteTime}
                            blackTimeLeft={currentBlackTime}
                            animationDuration={100}
                            allowDragging={false}
                        />
                    </div>

                    <div
                        className="flex-1 min-h-[200px] sm:min-h-0 sm:flex-initial sm:w-auto sm:min-w-[200px] sm:max-w-[300px] md:min-w-[250px] md:max-w-[350px] sm:h-[calc(min(350px,min(45vw,calc(100vh-12rem)))+13rem)] md:h-[calc(min(425px,min(45vw,calc(100vh-12rem)))+14rem)] lg:h-[calc(min(500px,min(45vw,calc(100vh-12rem)))+18.7rem)]"
                        data-cy="game-history-details"
                    >
                        <HistoryDetails
                            className="h-full w-full"
                            moves={game.moves}
                            currentMoveIndex={currentMoveIndex}
                            onMoveSelect={handleMoveSelect}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GameHistory;
