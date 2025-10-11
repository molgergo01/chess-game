import Spinner from '@/components/ui/spinner';

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center" data-cy="loading-screen">
            <Spinner className="size-14 md:size-20" />
        </div>
    );
}

export default LoadingScreen;
