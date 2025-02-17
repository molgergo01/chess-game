import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function FailedLoginAlert() {
    return (
        <Alert variant={'destructive'}>
            <AlertTitle>Oops, something went wrong!</AlertTitle>
            <AlertDescription>
                There was an issue while logging in, the servers might
                experience some problems!
            </AlertDescription>
        </Alert>
    );
}
