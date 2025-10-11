interface PlayerCellProps {
    whitePlayerName: string;
    whitePlayerElo: number;
    blackPlayerName: string;
    blackPlayerElo: number;
}

export function PlayerCell({ whitePlayerName, whitePlayerElo, blackPlayerName, blackPlayerElo }: PlayerCellProps) {
    return (
        <div data-cy="player-cell">
            <div className="flex gap-1 items-center" data-cy="player-cell-white">
                <span className="truncate max-w-24 sm:max-w-52">{whitePlayerName}</span>
                <span className="text-xs">{`(${whitePlayerElo})`}</span>
            </div>
            <div className="flex gap-1 items-center" data-cy="player-cell-black">
                <span className="truncate max-w-24 sm:max-w-52">{blackPlayerName}</span>
                <span className="text-xs">{`(${blackPlayerElo})`}</span>
            </div>
        </div>
    );
}
