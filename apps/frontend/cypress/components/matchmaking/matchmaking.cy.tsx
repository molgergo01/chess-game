import Matchmaking from '@/components/matchmaking/matchmaking';
import { withAllProviders } from '../../support/component';
import env from '@/lib/config/env';

describe('<Matchmaking />', () => {
    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/auth/user/me`, {
            statusCode: 200,
            body: { id: 'test-user-123', name: 'Test User' }
        }).as('getUser');

        cy.intercept('POST', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, {
            statusCode: 200
        }).as('joinQueue');

        cy.intercept('DELETE', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, {
            statusCode: 200
        }).as('leaveQueue');

        cy.intercept('POST', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private`, {
            statusCode: 200,
            body: { isQueued: true, queueId: 'test-queue-id-123', hasActiveGame: false }
        }).as('createPrivateQueue');

        cy.intercept('DELETE', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private/*`, {
            statusCode: 200
        }).as('leavePrivateQueue');
    });

    describe('when loading queue status', () => {
        beforeEach(() => {
            cy.intercept('GET', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/status*`, (req) => {
                req.reply(() => new Promise(() => {}));
            });

            const searchParams = new URLSearchParams();
            cy.mount(withAllProviders(<Matchmaking />, searchParams, '/matchmaking'));
        });

        it('should render "Loading..." text', () => {
            cy.getDataCy('loading-screen').should('be.visible');
        });

        it('should not render matchmaking card', () => {
            cy.getDataCy('matchmaking-card').should('not.exist');
        });
    });

    describe('when not in queue', () => {
        beforeEach(() => {
            cy.intercept('GET', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/status*`, {
                statusCode: 404
            }).as('checkQueue');

            const searchParams = new URLSearchParams();
            cy.mount(withAllProviders(<Matchmaking />, searchParams, '/matchmaking'));
            cy.wait('@getUser');
            cy.wait('@checkQueue');
        });

        it('should render Play Chess header', () => {
            cy.getDataCy('matchmaking-header').should('be.visible');
            cy.getDataCy('matchmaking-header').should('contain.text', 'Play Chess');
        });

        it('should render MatchmakingButton with "Play Online" text', () => {
            cy.getDataCy('matchmaking-button-join').should('exist');
            cy.getDataCy('matchmaking-button-join').should('be.visible');
            cy.getDataCy('matchmaking-button-join').should('contain.text', 'Play Online');
        });

        it('should render CreateLinkButton with "Play a Friend" text', () => {
            cy.getDataCy('matchmaking-button-invite-link').should('exist');
            cy.getDataCy('matchmaking-button-invite-link').should('be.visible');
            cy.getDataCy('matchmaking-button-invite-link').should('contain.text', 'Play a Friend');
        });

        it('should not render "Searching for an opponent..." text', () => {
            cy.getDataCy('matchmaking-searching-text').should('not.exist');
        });

        it('should not render "Waiting for friend to join..." text', () => {
            cy.getDataCy('matchmaking-waiting-text').should('not.exist');
        });
    });

    describe('when in public queue', () => {
        beforeEach(() => {
            cy.intercept('GET', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/status*`, {
                statusCode: 200,
                body: { isQueued: true, queueId: null, hasActiveGame: false }
            }).as('checkQueue');

            const searchParams = new URLSearchParams();
            cy.mount(withAllProviders(<Matchmaking />, searchParams, '/matchmaking'));
            cy.wait('@getUser');
            cy.wait('@checkQueue');
        });

        it('should render "Searching for an opponent..." text', () => {
            cy.getDataCy('matchmaking-searching-text').should('be.visible');
            cy.getDataCy('matchmaking-searching-text').should('contain.text', 'Searching for an opponent...');
        });

        it('should render LeaveMatchmakingButton with "Cancel" text', () => {
            cy.getDataCy('matchmaking-button-leave').should('exist');
            cy.getDataCy('matchmaking-button-leave').should('be.visible');
            cy.getDataCy('matchmaking-button-leave').should('contain.text', 'Cancel');
        });

        it('should not render join or invite buttons', () => {
            cy.getDataCy('matchmaking-button-join').should('not.exist');
            cy.getDataCy('matchmaking-button-invite-link').should('not.exist');
        });

        it('should not render "Waiting for friend to join..." text', () => {
            cy.getDataCy('matchmaking-waiting-text').should('not.exist');
        });
    });

    describe('when in private queue', () => {
        beforeEach(() => {
            cy.intercept('GET', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/status*`, {
                statusCode: 200,
                body: { isQueued: true, queueId: 'test-queue-id-123', hasActiveGame: false }
            }).as('checkQueue');

            const searchParams = new URLSearchParams();
            cy.mount(withAllProviders(<Matchmaking />, searchParams, '/matchmaking'));
            cy.wait('@getUser');
            cy.wait('@checkQueue');
        });

        it('should render "Waiting for friend to join..." text', () => {
            cy.getDataCy('matchmaking-waiting-text').should('be.visible');
            cy.getDataCy('matchmaking-waiting-text').should('contain.text', 'Waiting for friend to join...');
        });

        it('should render CancelInviteButton with "Cancel" text', () => {
            cy.getDataCy('matchmaking-button-leave').should('exist');
            cy.getDataCy('matchmaking-button-leave').should('be.visible');
            cy.getDataCy('matchmaking-button-leave').should('contain.text', 'Cancel');
        });

        it('should render copyable link', () => {
            cy.getDataCy('matchmaking-invite-link-container').should('be.visible');
            cy.getDataCy('matchmaking-invite-link').should('exist');
            cy.getDataCy('matchmaking-copy-link-button').should('be.visible');
        });

        it('should not render "Searching for an opponent..." text', () => {
            cy.getDataCy('matchmaking-searching-text').should('not.exist');
        });

        it('should not render join or invite buttons', () => {
            cy.getDataCy('matchmaking-button-join').should('not.exist');
            cy.getDataCy('matchmaking-button-invite-link').should('not.exist');
        });
    });

    describe('error handling', () => {
        beforeEach(() => {
            cy.intercept('GET', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/status*`, {
                statusCode: 404
            }).as('checkQueue');

            const searchParams = new URLSearchParams();
            cy.mount(withAllProviders(<Matchmaking />, searchParams, '/matchmaking'));
            cy.wait('@getUser');
            cy.wait('@checkQueue');
        });

        it('should display error alert when join queue fails', () => {
            cy.intercept('POST', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, {
                statusCode: 500,
                body: { message: 'Server error' }
            }).as('joinQueueError');

            cy.getDataCy('matchmaking-button-join').click();

            cy.wait('@joinQueueError');

            cy.getDataCy('matchmaking-error-alert').should('be.visible');
        });

        it('should auto-hide error after 5 seconds', () => {
            cy.intercept('POST', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, {
                statusCode: 500,
                body: { message: 'Server error' }
            }).as('joinQueueError');

            cy.getDataCy('matchmaking-button-join').click();
            cy.wait('@joinQueueError');

            cy.getDataCy('matchmaking-error-alert').should('be.visible');

            cy.wait(5500);

            cy.getDataCy('matchmaking-error-alert').should('not.exist');
        });
    });
});
