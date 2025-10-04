import Matchmaking from '@/components/matchmaking/matchmaking';
import { withAllProviders } from '../../support/component';
import env from '@/lib/config/env';

describe('<Matchmaking />', () => {
    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/user/me`, {
            statusCode: 200,
            body: { id: 'test-user-123', name: 'Test User' }
        }).as('getUser');

        cy.intercept('POST', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, {
            statusCode: 200
        });
        cy.intercept('DELETE', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/*`, {
            statusCode: 200
        });
    });

    describe('when loading queue status', () => {
        beforeEach(() => {
            cy.intercept('GET', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/*`, (req) => {
                req.reply(() => new Promise(() => {})); // Never resolves
            });

            cy.mount(withAllProviders(<Matchmaking />));
        });

        it('should render "Loading..." text', () => {
            cy.contains('Loading...').should('be.visible');
        });

        it('should not render matchmaking button', () => {
            cy.getDataCy('matchmaking-button').should('not.exist');
        });
    });

    describe('when not in queue', () => {
        beforeEach(() => {
            cy.intercept('GET', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/*`, {
                statusCode: 404
            }).as('checkQueue');

            cy.mount(withAllProviders(<Matchmaking />));
            cy.wait('@getUser');
            cy.wait('@checkQueue');
        });

        it('should render MatchmakingButton', () => {
            cy.getDataCy('matchmaking-button').should('exist');
            cy.getDataCy('matchmaking-button').should('be.visible');
        });

        it('should display "Queue" text on button', () => {
            cy.getDataCy('matchmaking-button').should('contain.text', 'Queue');
        });

        it('should not render "Searching for an opponent..." text', () => {
            cy.contains('Searching for an opponent...').should('not.exist');
        });
    });

    describe('when in queue', () => {
        beforeEach(() => {
            cy.intercept('GET', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/*`, {
                statusCode: 200
            }).as('checkQueue');

            cy.mount(withAllProviders(<Matchmaking />));
            cy.wait('@getUser');
            cy.wait('@checkQueue');
        });

        it('should render "Searching for an opponent..." text', () => {
            cy.contains('Searching for an opponent...').should('be.visible');
        });

        it('should render LeaveMatchmakingButton', () => {
            cy.getDataCy('matchmaking-button').should('exist');
            cy.getDataCy('matchmaking-button').should('be.visible');
        });

        it('should display "Leave Queue" text on button', () => {
            cy.getDataCy('matchmaking-button').should('contain.text', 'Leave Queue');
        });
    });
});
