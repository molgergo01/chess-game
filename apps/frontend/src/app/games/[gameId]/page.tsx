import GameHistory from '@/components/history/game-history';
import { getGame } from '@/lib/clients/core.rest.client';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function GameHistoryPage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = await params;
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    try {
        const game = await getGame(gameId, cookieHeader);
        return <GameHistory game={game} />;
    } catch (error) {
        if (error instanceof Error && 'status' in error && (error.status === 404 || error.status === 400)) {
            notFound();
        }
        throw error;
    }
}
