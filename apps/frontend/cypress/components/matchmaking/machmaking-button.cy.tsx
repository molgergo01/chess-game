import MatchmakingButton from '@/components/matchmaking/machmaking-button';
import { withAuthAndRouter } from '../../support/component';
import env from '@/lib/config/env';

describe('<MatchmakingButton />', () => {
    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/auth/user/me`, {
            statusCode: 200,
            body: { id: 'test-user-123', name: 'Test User' }
        });

        cy.intercept('POST', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, {
            statusCode: 200
        }).as('joinQueue');
    });

    it('should render button with correct data-cy attribute', () => {
        cy.mount(withAuthAndRouter(<MatchmakingButton />));

        cy.getDataCy('matchmaking-button-join').should('exist');
    });

    it('should be visible', () => {
        cy.mount(withAuthAndRouter(<MatchmakingButton />));

        cy.getDataCy('matchmaking-button-join').should('be.visible');
    });

    it('should display "Play Online" text', () => {
        cy.mount(withAuthAndRouter(<MatchmakingButton />));

        cy.getDataCy('matchmaking-button-join').should('contain.text', 'Play Online');
    });

    it('should call joinQueue API when clicked', () => {
        cy.mount(withAuthAndRouter(<MatchmakingButton />));

        cy.getDataCy('matchmaking-button-join').click();

        cy.wait('@joinQueue');
    });

    it('should call onJoinQueue callback on successful join', () => {
        const onJoinQueue = cy.stub().as('onJoinQueue');

        cy.mount(withAuthAndRouter(<MatchmakingButton onJoinQueue={onJoinQueue} />));

        cy.getDataCy('matchmaking-button-join').click();

        cy.wait('@joinQueue').then(() => {
            cy.get('@onJoinQueue').should('have.been.calledOnce');
        });
    });

    it('should call onError callback when API fails', () => {
        cy.intercept('POST', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, {
            statusCode: 500,
            body: { message: 'Internal server error' }
        }).as('joinQueueError');

        const onError = cy.stub().as('onError');

        cy.mount(withAuthAndRouter(<MatchmakingButton onError={onError} />));

        cy.getDataCy('matchmaking-button-join').click();

        cy.wait('@joinQueueError').then(() => {
            cy.get('@onError').should('have.been.calledOnce');
        });
    });
});
