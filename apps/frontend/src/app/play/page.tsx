import Game from '@/components/chess/game';

export default function PlayPage() {
    return (
        <div className={'flex place-content-center p-10'}>
            <Game className={'md:max-w-xl max-w-sm flex-1'} />
        </div>
    );
}
