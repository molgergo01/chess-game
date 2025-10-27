'use client';

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEffect, useState } from 'react';
import Pagination from '@/components/ui/pagination';
import { cn } from '@/lib/utils/utils';
import ErrorAlertScreen from '@/components/ui/error-alert-screen';
import LoadingScreen from '@/components/ui/loading-screen';
import { PlayerLeaderboard } from '@/lib/models/leaderboard/playerLeaderboard';
import { getPlayerLeaderboard } from '@/lib/clients/core.rest.client';
import { LeaderboardPlayerCell } from '@/components/leaderboard/leaderboard-player-cell';

function Leaderboard() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<PlayerLeaderboard | null>(null);
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
        const getLeaderboard = async () => {
            try {
                const leaderboardResponse = await getPlayerLeaderboard(
                    entriesPerPage,
                    entriesPerPage * (pageNumber - 1)
                );
                setLeaderboard(leaderboardResponse);
                if (entriesPerPage === 0 || leaderboardResponse.totalCount === 0) {
                    setTotalPages(1);
                } else {
                    setTotalPages(Math.ceil(leaderboardResponse.totalCount / entriesPerPage));
                }
            } catch (error) {
                console.error('Failed to get leaderboard', error);
                if (error instanceof Error) {
                    setErrorMessage(error.message);
                }
            }
        };

        getLeaderboard();
    }, [pageNumber, entriesPerPage]);

    if (errorMessage) {
        return (
            <ErrorAlertScreen errorMessage={errorMessage} title="Leaderboard Error" dataCy="leaderboard-error-alert" />
        );
    }

    if (!leaderboard) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center" data-cy="leaderboard-page">
            <div className="w-full sm:w-3/4 justify-items-center overflow-auto-show">
                <Table data-cy="leaderboard-table">
                    <TableCaption data-cy="leaderboard-table-caption">{`Showing ${(pageNumber - 1) * entriesPerPage + (leaderboard.totalCount === 0 ? 0 : 1)} - ${Math.min(pageNumber * entriesPerPage, leaderboard.totalCount)} of ${leaderboard.totalCount} players`}</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead></TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead>Rating</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody data-cy="leaderboard-table-body">
                        {leaderboard.users.map((user) => (
                            <TableRow key={user.userId} data-cy="leaderboard-table-row">
                                <TableCell>
                                    <div>#{user.rank}</div>
                                </TableCell>
                                <TableCell>
                                    <LeaderboardPlayerCell playerName={user.name} playerAvatarUrl={user.avatarUrl} />
                                </TableCell>
                                <TableCell>
                                    <div>{user.elo}</div>
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
                    data-cy="leaderboard-pagination"
                />
            </div>
        </div>
    );
}

export default Leaderboard;
