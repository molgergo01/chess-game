import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getGameId, joinGame } from '@/lib/clients/core.socket.client';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';

function useGameId() {
    const router = useRouter();
    const [gameId, setGameId] = useState<string>();
    const { socket } = useCoreSocket();

    useEffect(() => {
        if (!socket || gameId) return;
        const initializeGameId = async () => {
            const response = await getGameId(socket);
            const gameId = response.gameId;
            if (!gameId) {
                router.push('/play');
                return;
            }

            setGameId(gameId);
            joinGame(socket, gameId);
        };
        initializeGameId();
    }, [socket, router, gameId]);

    return [gameId, setGameId] as const;
}

export default useGameId;
