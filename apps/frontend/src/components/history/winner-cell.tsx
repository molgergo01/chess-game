import { Winner } from '@/lib/models/history/history';

interface WinnerCellProps {
    blackPlayerId: string;
    whitePlayerId: string;
    userId: string;
    winner: Winner;
}

export function WinnerCell(props: WinnerCellProps) {
    const { blackPlayerId, whitePlayerId, userId, winner } = props;

    const isDraw = winner === Winner.DRAW;
    const isUserBlack = userId === blackPlayerId;
    const isUserWhite = userId === whitePlayerId;
    const didUserWin = (winner === Winner.BLACK && isUserBlack) || (winner === Winner.WHITE && isUserWhite);

    const getBackgroundColor = () => {
        if (isDraw) return 'bg-gray-500';
        return didUserWin ? 'bg-green-500' : 'bg-red-500';
    };

    const getLetter = () => {
        if (isDraw) return '=';
        return didUserWin ? '+' : '-';
    };

    return (
        <div
            className={`${getBackgroundColor()} text-white font-bold w-8 h-8 flex items-center justify-center rounded`}
            data-cy="winner-cell"
        >
            {getLetter()}
        </div>
    );
}
