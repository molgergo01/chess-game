import { mount } from 'cypress/react';
import './commands';
import '@/app/globals.css';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { AuthProvider } from '@/hooks/auth/useAuth';
import { MatchmakingSocketProvider } from '@/hooks/matchmaking/useMatchmakingSocket';
import { CoreSocketProvider } from '@/hooks/chess/useCoreSocket';
import React from 'react';
import { PathnameContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';

Cypress.Commands.add('mount', mount);

// const defaultSearchParams = new URLSearchParams();
// const defaultPathname = '/';

// export const PathnameContext = React.createContext<string>(defaultPathname);
// export const SearchParamsContext = React.createContext<URLSearchParams>(defaultSearchParams);

const mockRouter = {
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {}
};

export function withAppRouter(component: React.ReactNode) {
    return <AppRouterContext.Provider value={mockRouter}>{component}</AppRouterContext.Provider>;
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

export function withAllProviders(component: React.ReactNode, searchParams?: URLSearchParams, pathname?: string) {
    let wrapped = component;

    if (searchParams) {
        wrapped = <SearchParamsContext.Provider value={searchParams}>{wrapped}</SearchParamsContext.Provider>;
    }

    if (pathname) {
        wrapped = <PathnameContext.Provider value={pathname}>{wrapped}</PathnameContext.Provider>;
    }

    return withAppRouter(withAuth(withCoreSocket(withMatchmakingSocket(wrapped))));
}
