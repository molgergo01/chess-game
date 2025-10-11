import GameHistory from '@/components/history/game-history';
import { getGame } from '@/lib/clients/core.rest.client';
import { notFound } from 'next/navigation';

export default async function GameHistoryPage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = await params;

    try {
        const game = await getGame(gameId);
        return <GameHistory game={game} />;
    } catch (error) {
        if (error instanceof Error && 'status' in error && (error.status === 404 || error.status === 400)) {
            notFound();
        }
        throw error;
    }
}
