import LeaveMatchmakingButton from '@/components/matchmaking/leave-matchmaking-button';
import { withAuthAndRouter } from '../../support/component';
import env from '@/lib/config/env';

describe('<LeaveMatchmakingButton />', () => {
    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/auth/user/me`, {
            statusCode: 200,
            body: { id: 'test-user-123', name: 'Test User' }
        });

        cy.intercept('DELETE', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, {
            statusCode: 200
        }).as('leaveQueue');
    });

    it('should render button with correct data-cy attribute', () => {
        cy.mount(withAuthAndRouter(<LeaveMatchmakingButton />));

        cy.getDataCy('matchmaking-button-leave').should('exist');
    });

    it('should be visible', () => {
        cy.mount(withAuthAndRouter(<LeaveMatchmakingButton />));

        cy.getDataCy('matchmaking-button-leave').should('be.visible');
    });

    it('should display "Cancel" text', () => {
        cy.mount(withAuthAndRouter(<LeaveMatchmakingButton />));

        cy.getDataCy('matchmaking-button-leave').should('contain.text', 'Cancel');
    });

    it('should call leaveQueue API when clicked', () => {
        cy.mount(withAuthAndRouter(<LeaveMatchmakingButton />));

        cy.getDataCy('matchmaking-button-leave').click();

        cy.wait('@leaveQueue');
    });

    it('should call onLeaveQueue callback on successful leave', () => {
        const onLeaveQueue = cy.stub().as('onLeaveQueue');

        cy.mount(withAuthAndRouter(<LeaveMatchmakingButton onLeaveQueue={onLeaveQueue} />));

        cy.getDataCy('matchmaking-button-leave').click();

        cy.wait('@leaveQueue').then(() => {
            cy.get('@onLeaveQueue').should('have.been.calledOnce');
        });
    });

    it('should call onError callback when API fails', () => {
        cy.intercept('DELETE', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`, {
            statusCode: 500,
            body: { message: 'Internal server error' }
        }).as('leaveQueueError');

        const onError = cy.stub().as('onError');

        cy.mount(withAuthAndRouter(<LeaveMatchmakingButton onError={onError} />));

        cy.getDataCy('matchmaking-button-leave').click();

        cy.wait('@leaveQueueError').then(() => {
            cy.get('@onError').should('have.been.calledOnce');
        });
    });
});
