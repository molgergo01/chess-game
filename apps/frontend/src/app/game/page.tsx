import Game from '@/components/game/game';
import { CoreSocketProvider } from '@/hooks/chess/useCoreSocket';

export default function PlayPage() {
    return (
        <CoreSocketProvider>
            <Game className="" />
        </CoreSocketProvider>
    );
}
