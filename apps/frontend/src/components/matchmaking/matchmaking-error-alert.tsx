import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface MatchmakingErrorAlertProps extends React.ComponentProps<'div'> {
    message: string;
}

export default function MatchmakingErrorAlert({ message, className, ...props }: MatchmakingErrorAlertProps) {
    return (
        <div className={className} {...props}>
            <Alert variant={'destructive'}>
                <AlertTitle>Matchmaking Error</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
            </Alert>
        </div>
    );
}
