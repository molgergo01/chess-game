'use client';

import LoginForm from '@/components/login/login-form';
import FailedLoginAlert from '@/components/login/failed-login-alert';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function LoginPage() {
    return (
        <Suspense>
            <PageBody />
        </Suspense>
    );
}

function PageBody() {
    const searchParams = useSearchParams();
    const failedLoginParam = searchParams.has('failedLogin');

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            {failedLoginParam && (
                <FailedLoginAlert
                    className="w-full max-w-sm md:max-w-3xl p-6 md:p-8"
                    data-cy="login-alert"
                />
            )}
            <div className="w-full max-w-sm md:max-w-3xl">
                <LoginForm />
            </div>
        </div>
    );
}
