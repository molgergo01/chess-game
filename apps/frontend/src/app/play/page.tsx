import Matchmaking from '@/components/matchmaking/matchmaking';
import { MatchmakingSocketProvider } from '@/hooks/matchmaking/useMatchmakingSocket';
import { connection } from 'next/server';

export default async function MatchMakePage() {
    await connection();
    return (
        <MatchmakingSocketProvider>
            <Matchmaking />
        </MatchmakingSocketProvider>
    );
}
