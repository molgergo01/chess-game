import Leaderboard from '@/components/leaderboard/leaderboard';
import { withAuthAndRouter } from '../../support/component';
import { PlayerLeaderboard } from '@/lib/models/leaderboard/playerLeaderboard';
import env from '@/lib/config/env';

describe('<Leaderboard />', () => {
    const mockLeaderboard: PlayerLeaderboard = {
        users: [
            {
                userId: 'user-1',
                rank: 1,
                name: 'Magnus Carlsen',
                elo: 2850,
                avatarUrl: 'https://example.com/magnus.jpg'
            },
            {
                userId: 'user-2',
                rank: 2,
                name: 'Hikaru Nakamura',
                elo: 2800,
                avatarUrl: null
            },
            {
                userId: 'user-3',
                rank: 3,
                name: 'Fabiano Caruana',
                elo: 2780,
                avatarUrl: 'https://example.com/fabiano.jpg'
            }
        ],
        totalCount: 3
    };

    beforeEach(() => {
        cy.stub(window, 'matchMedia').returns({
            matches: false,
            media: '',
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true
        });
    });

    it('should show loading screen initially', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/leaderboard*`, {
            statusCode: 200,
            delay: 10000,
            body: { users: [], totalCount: 0 }
        });

        cy.mount(withAuthAndRouter(<Leaderboard />));

        cy.getDataCy('loading-screen').should('be.visible');
    });

    it('should render table with leaderboard data', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/leaderboard*`, {
            statusCode: 200,
            body: mockLeaderboard
        });

        cy.mount(withAuthAndRouter(<Leaderboard />));

        cy.getDataCy('leaderboard-table').should('be.visible');
        cy.contains('Magnus Carlsen').should('be.visible');
        cy.contains('Hikaru Nakamura').should('be.visible');
        cy.contains('Fabiano Caruana').should('be.visible');
    });

    it('should display player cells correctly', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/leaderboard*`, {
            statusCode: 200,
            body: mockLeaderboard
        });

        cy.mount(withAuthAndRouter(<Leaderboard />));

        cy.getDataCy('leaderboard-player-cell').should('have.length', 3);
    });

    it('should display ranks correctly', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/leaderboard*`, {
            statusCode: 200,
            body: mockLeaderboard
        });

        cy.mount(withAuthAndRouter(<Leaderboard />));

        cy.getDataCy('leaderboard-table-body').should('contain', '#1');
        cy.getDataCy('leaderboard-table-body').should('contain', '#2');
        cy.getDataCy('leaderboard-table-body').should('contain', '#3');
    });

    it('should display ELO ratings correctly', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/leaderboard*`, {
            statusCode: 200,
            body: mockLeaderboard
        });

        cy.mount(withAuthAndRouter(<Leaderboard />));

        cy.getDataCy('leaderboard-table-body').should('contain', '2850');
        cy.getDataCy('leaderboard-table-body').should('contain', '2800');
        cy.getDataCy('leaderboard-table-body').should('contain', '2780');
    });

    it('should show error alert on API failure', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/leaderboard*`, {
            statusCode: 500,
            body: { message: 'Failed to fetch leaderboard' }
        });

        cy.mount(withAuthAndRouter(<Leaderboard />));

        cy.getDataCy('leaderboard-error-alert').should('be.visible');
        cy.contains('Failed to fetch leaderboard').should('be.visible');
    });

    it('should show pagination when multiple pages exist', () => {
        const largeLeaderboard: PlayerLeaderboard = {
            users: Array.from({ length: 10 }, (_, i) => ({
                userId: `user-${i}`,
                rank: i + 1,
                name: `Player ${i + 1}`,
                elo: 2000 + i * 10,
                avatarUrl: null
            })),
            totalCount: 50
        };

        cy.intercept('GET', `${env.REST_URLS.CORE}/api/leaderboard*`, {
            statusCode: 200,
            body: largeLeaderboard
        });

        cy.mount(withAuthAndRouter(<Leaderboard />));

        cy.getDataCy('leaderboard-pagination').should('be.visible');
        cy.getDataCy('pagination-nav-first').should('be.visible');
    });

    it('should hide pagination when only one page', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/leaderboard*`, {
            statusCode: 200,
            body: mockLeaderboard
        });

        cy.mount(withAuthAndRouter(<Leaderboard />));

        cy.getDataCy('leaderboard-pagination').should('not.be.visible');
    });

    it('should display correct table caption with entry counts', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/leaderboard*`, {
            statusCode: 200,
            body: mockLeaderboard
        });

        cy.mount(withAuthAndRouter(<Leaderboard />));

        cy.getDataCy('leaderboard-table-caption').should('contain', 'Showing 1 - 3 of 3 players');
    });
});
