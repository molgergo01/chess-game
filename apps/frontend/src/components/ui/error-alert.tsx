import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorAlertProps extends React.ComponentProps<'div'> {
    message: string;
    title: string;
}

function ErrorAlert({ message, title, className, ...props }: ErrorAlertProps) {
    return (
        <div className={className} {...props}>
            <Alert variant={'destructive'}>
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
            </Alert>
        </div>
    );
}

export default ErrorAlert;
