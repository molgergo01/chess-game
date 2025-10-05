import { mount } from 'cypress/react';
import './commands';
import '@/app/globals.css';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { AuthProvider } from '@/hooks/auth/useAuth';
import { MatchmakingSocketProvider } from '@/hooks/matchmaking/useMatchmakingSocket';
import { CoreSocketProvider } from '@/hooks/chess/useCoreSocket';

Cypress.Commands.add('mount', mount);

const mockRouter = {
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {}
    // Add other router methods as needed
};

export function withAppRouter(component: React.ReactNode) {
    return (
        <AppRouterContext.Provider value={mockRouter}>
            {component}
        </AppRouterContext.Provider>
    );
}

export function withAuth(component: React.ReactNode) {
    return <AuthProvider>{component}</AuthProvider>;
}

export function withAuthAndRouter(component: React.ReactNode) {
    return withAppRouter(withAuth(component));
}

export function withMatchmakingSocket(component: React.ReactNode) {
    return <MatchmakingSocketProvider>{component}</MatchmakingSocketProvider>;
}

export function withCoreSocket(component: React.ReactNode) {
    return <CoreSocketProvider>{component}</CoreSocketProvider>;
}

export function withAllProviders(component: React.ReactNode) {
    return withAppRouter(
        withAuth(withCoreSocket(withMatchmakingSocket(component)))
    );
}
