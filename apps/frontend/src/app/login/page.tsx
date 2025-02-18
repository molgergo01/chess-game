'use client';

import LoginForm from '@/components/login/login-form';
import FailedLoginAlert from '@/components/login/failed-login-alert';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const failedLoginParam = searchParams.has('failedLogin');

    return (
        <Suspense>
            <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
                <div className="w-full max-w-sm md:max-w-3xl p-6 md:p-8">
                    {failedLoginParam && <FailedLoginAlert />}
                </div>
                <div className="w-full max-w-sm md:max-w-3xl">
                    <LoginForm />
                </div>
            </div>
        </Suspense>
    );
}
