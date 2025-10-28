'use client';

import { PieceDropHandlerArgs } from 'react-chessboard';
import React from 'react';
import Banner from '@/components/ui/banner';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import ClientOnlyChessboard from '@/components/ui/client-only-chessboard';

interface PlayerInfo {
    name: string;
    elo: number;
    avatarUrl: string | null;
}

interface ChessboardWithBannersProps {
    boardPosition: string;
    boardOrientation: MatchmakingColor;
    turnColor: MatchmakingColor | undefined;
    whitePlayerInfo: PlayerInfo;
    blackPlayerInfo: PlayerInfo;
    whiteTimeLeft: number;
    blackTimeLeft: number;
    onPieceDrop?: (args: PieceDropHandlerArgs) => boolean;
    animationDuration?: number;
    allowDragging: boolean;
}

function ChessboardWithBanners({
    boardPosition,
    boardOrientation,
    turnColor,
    whitePlayerInfo,
    blackPlayerInfo,
    whiteTimeLeft,
    blackTimeLeft,
    onPieceDrop,
    animationDuration = 0,
    allowDragging = true
}: ChessboardWithBannersProps) {
    const topPlayerInfo = boardOrientation === MatchmakingColor.WHITE ? blackPlayerInfo : whitePlayerInfo;
    const bottomPlayerInfo = boardOrientation === MatchmakingColor.WHITE ? whitePlayerInfo : blackPlayerInfo;
    const topPlayerColor =
        boardOrientation === MatchmakingColor.WHITE ? MatchmakingColor.BLACK : MatchmakingColor.WHITE;
    const bottomPlayerColor =
        boardOrientation === MatchmakingColor.WHITE ? MatchmakingColor.WHITE : MatchmakingColor.BLACK;
    const topPlayerTimeLeft = boardOrientation === MatchmakingColor.WHITE ? blackTimeLeft : whiteTimeLeft;
    const bottomPlayerTimeLeft = boardOrientation === MatchmakingColor.WHITE ? whiteTimeLeft : blackTimeLeft;

    const chessboardOptions = {
        position: boardPosition,
        boardOrientation: boardOrientation,
        onPieceDrop: onPieceDrop || (() => false),
        animationDurationInMs: animationDuration,
        allowDragging: allowDragging
    };

    return (
        <>
            <div className="flex-grow-0 grid grid-cols-2 sm:hidden" data-cy="game-mobile-banners">
                <Banner
                    className="rounded-r-3xl"
                    playerName={bottomPlayerInfo.name}
                    playerColor={bottomPlayerColor}
                    isOpponent={false}
                    turnColor={turnColor}
                    timeLeft={bottomPlayerTimeLeft}
                    elo={bottomPlayerInfo.elo}
                    avatarUrl={bottomPlayerInfo.avatarUrl}
                />
                <Banner
                    className="rounded-l-3xl"
                    playerName={topPlayerInfo.name}
                    playerColor={topPlayerColor}
                    isOpponent={true}
                    turnColor={turnColor}
                    timeLeft={topPlayerTimeLeft}
                    elo={topPlayerInfo.elo}
                    avatarUrl={topPlayerInfo.avatarUrl}
                />
            </div>

            <Banner
                className="hidden sm:flex flex-col sm:w-[min(500px,min(45vw,calc(100vh-12rem)))] lg:w-[min(650px,min(50vw,calc(100vh-10rem)))] sm:rounded-lg sm:border-2 sm:border-border sm:overflow-hidden"
                playerColor={topPlayerColor}
                isOpponent={true}
                turnColor={turnColor}
                timeLeft={topPlayerTimeLeft}
                playerName={topPlayerInfo.name}
                elo={topPlayerInfo.elo}
                avatarUrl={topPlayerInfo.avatarUrl}
                data-cy="game-desktop-banner-top"
            />

            <div
                className="w-full max-w-[min(100vw,calc(100vh-22rem))] aspect-square mx-auto flex-shrink-0 sm:w-[min(500px,min(45vw,calc(100vh-12rem)))] sm:h-[min(500px,min(45vw,calc(100vh-12rem)))] lg:w-[min(650px,min(50vw,calc(100vh-10rem)))] lg:h-[min(650px,min(50vw,calc(100vh-10rem)))] sm:max-w-none sm:aspect-auto"
                data-cy="game-chessboard-container"
            >
                <ClientOnlyChessboard options={chessboardOptions} />
            </div>

            <Banner
                className="hidden sm:flex flex-col sm:w-[min(500px,min(45vw,calc(100vh-12rem)))] lg:w-[min(650px,min(50vw,calc(100vh-10rem)))] sm:rounded-lg sm:border-2 sm:border-border sm:overflow-hidden"
                playerColor={bottomPlayerColor}
                isOpponent={false}
                turnColor={turnColor}
                timeLeft={bottomPlayerTimeLeft}
                playerName={bottomPlayerInfo.name}
                elo={bottomPlayerInfo.elo}
                avatarUrl={bottomPlayerInfo.avatarUrl}
                data-cy="game-desktop-banner-bottom"
            />
        </>
    );
}

export default ChessboardWithBanners;
