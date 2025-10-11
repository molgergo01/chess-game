import ErrorAlert from '@/components/ui/error-alert';

interface ErrorAlertProps {
    errorMessage: string;
    title: string;
    dataCy: string;
}

function ErrorAlertScreen({ errorMessage, title, dataCy }: ErrorAlertProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4" data-cy="error-alert-screen">
            <ErrorAlert message={errorMessage} title={title} className="w-full max-w-md" data-cy={dataCy} />
        </div>
    );
}

export default ErrorAlertScreen;
