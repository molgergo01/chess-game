'use client';

import Matchmaking from '@/components/matchmaking/matchmaking';
import { MatchmakingSocketProvider } from '@/hooks/matchmaking/useMatchmakingSocket';

export default function MatchMakePage() {
    return (
        <MatchmakingSocketProvider>
            <Matchmaking className="flex place-content-center p-10" />;
        </MatchmakingSocketProvider>
    );
}
