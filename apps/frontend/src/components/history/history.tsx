'use client';

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils/date.utils';
import { useAuth } from '@/hooks/auth/useAuth';
import { GameHistory } from '@/lib/models/history/history';
import { useEffect, useState } from 'react';
import { getGameHistory } from '@/lib/clients/core.rest.client';
import Pagination from '@/components/ui/pagination';
import { cn } from '@/lib/utils/utils';
import { PlayerCell } from '@/components/history/player-cell';
import { WinnerCell } from '@/components/history/winner-cell';
import Link from 'next/link';
import ErrorAlertScreen from '@/components/ui/error-alert-screen';
import LoadingScreen from '@/components/ui/loading-screen';

function History() {
    const { userId } = useAuth();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [history, setHistory] = useState<GameHistory | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [siblingCount, setSiblingCount] = useState(1);

    useEffect(() => {
        const updateSettings = () => {
            const hasEnoughVerticalSpace = window.matchMedia('(min-height: 1024px)').matches;
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            setEntriesPerPage(hasEnoughVerticalSpace ? 15 : 10);
            setSiblingCount(isMobile ? 1 : 2);
            setPageNumber(1);
        };

        updateSettings();

        let timeoutId: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(updateSettings, 500);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        const getHistory = async () => {
            try {
                const historyResponse = await getGameHistory(entriesPerPage, entriesPerPage * (pageNumber - 1));
                setHistory(historyResponse);
            } catch (error) {
                console.error('Failed to get history', error);
                if (error instanceof Error) {
                    setErrorMessage(error.message);
                }
            }
        };

        getHistory();
    }, [pageNumber, entriesPerPage]);

    useEffect(() => {
        if (!history) {
            return;
        }

        if (entriesPerPage === 0 || history.totalCount === 0) {
            setTotalPages(1);
        } else {
            setTotalPages(Math.ceil(history.totalCount / entriesPerPage));
        }
    }, [entriesPerPage, history]);

    if (errorMessage) {
        return <ErrorAlertScreen errorMessage={errorMessage} title="History Error" dataCy="history-error-alert" />;
    }

    if (!history || !userId) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center" data-cy="history-page">
            <div className="w-full sm:w-3/4 justify-items-center overflow-auto-show">
                <Table data-cy="history-table">
                    <TableCaption data-cy="history-table-caption">{`Showing ${(pageNumber - 1) * entriesPerPage + (history.totalCount === 0 ? 0 : 1)} - ${Math.min(pageNumber * entriesPerPage, history.totalCount)} of ${history.totalCount} games`}</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Players</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Result</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody data-cy="history-table-body">
                        {history.games.map((game) => (
                            <TableRow key={game.gameId} data-cy="history-table-row">
                                <TableCell noPadding>
                                    <Link href={`/games/${game.gameId}`} className="block p-2 h-full cursor-pointer">
                                        <PlayerCell
                                            whitePlayerName={game.whitePlayer.name}
                                            blackPlayerName={game.blackPlayer.name}
                                            whitePlayerElo={game.whitePlayer.elo}
                                            blackPlayerElo={game.blackPlayer.elo}
                                        />
                                    </Link>
                                </TableCell>
                                <TableCell noPadding>
                                    <Link href={`/games/${game.gameId}`} className="block p-2 h-full cursor-pointer">
                                        <div>{formatDate(new Date(game.startedAt))}</div>
                                    </Link>
                                </TableCell>
                                <TableCell noPadding>
                                    <Link href={`/games/${game.gameId}`} className="block p-2 h-full cursor-pointer">
                                        <WinnerCell
                                            blackPlayerId={game.blackPlayer.userId}
                                            whitePlayerId={game.whitePlayer.userId}
                                            userId={userId}
                                            winner={game.winner}
                                        />
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Pagination
                    className={cn('p-5', totalPages === 1 ? 'hidden' : '')}
                    currentPage={pageNumber}
                    totalPages={totalPages}
                    onPageChange={setPageNumber}
                    siblingCount={siblingCount}
                    data-cy="history-pagination"
                />
            </div>
        </div>
    );
}

export default History;
