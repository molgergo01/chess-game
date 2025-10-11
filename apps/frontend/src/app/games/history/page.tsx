import History from '@/components/history/history';
import { AuthProvider } from '@/hooks/auth/useAuth';

export default async function HistoryPage() {
    return (
        <AuthProvider>
            <History />
        </AuthProvider>
    );
}
