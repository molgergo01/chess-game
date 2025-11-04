import CancelInviteButton from '@/components/matchmaking/cancel-invite-button';
import { withAuthAndRouter } from '../../support/component';
import env from '@/lib/config/env';

describe('<CancelInviteButton />', () => {
    const mockQueueId = 'test-queue-id-123';

    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/auth/user/me`, {
            statusCode: 200,
            body: { id: 'test-user-123', name: 'Test User' }
        });

        cy.intercept('DELETE', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private/*`, {
            statusCode: 200
        }).as('leavePrivateQueue');
    });

    it('should render button with correct data-cy attribute', () => {
        cy.mount(withAuthAndRouter(<CancelInviteButton queueId={mockQueueId} />));

        cy.getDataCy('matchmaking-button-leave').should('exist');
    });

    it('should be visible', () => {
        cy.mount(withAuthAndRouter(<CancelInviteButton queueId={mockQueueId} />));

        cy.getDataCy('matchmaking-button-leave').should('be.visible');
    });

    it('should display "Cancel" text', () => {
        cy.mount(withAuthAndRouter(<CancelInviteButton queueId={mockQueueId} />));

        cy.getDataCy('matchmaking-button-leave').should('contain.text', 'Cancel');
    });

    it('should call leavePrivateQueue API when clicked', () => {
        cy.mount(withAuthAndRouter(<CancelInviteButton queueId={mockQueueId} />));

        cy.getDataCy('matchmaking-button-leave').click();

        cy.wait('@leavePrivateQueue');
    });

    it('should call onLeaveQueue callback on successful leave', () => {
        const onLeaveQueue = cy.stub().as('onLeaveQueue');

        cy.mount(withAuthAndRouter(<CancelInviteButton queueId={mockQueueId} onLeaveQueue={onLeaveQueue} />));

        cy.getDataCy('matchmaking-button-leave').click();

        cy.wait('@leavePrivateQueue').then(() => {
            cy.get('@onLeaveQueue').should('have.been.calledOnce');
        });
    });

    it('should call onError callback when API fails', () => {
        cy.intercept('DELETE', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private/*`, {
            statusCode: 500,
            body: { message: 'Internal server error' }
        }).as('leavePrivateQueueError');

        const onError = cy.stub().as('onError');

        cy.mount(withAuthAndRouter(<CancelInviteButton queueId={mockQueueId} onError={onError} />));

        cy.getDataCy('matchmaking-button-leave').click();

        cy.wait('@leavePrivateQueueError').then(() => {
            cy.get('@onError').should('have.been.calledOnce');
        });
    });

    it('should call onError when queueId is null', () => {
        const onError = cy.stub().as('onError');

        cy.mount(withAuthAndRouter(<CancelInviteButton queueId={null} onError={onError} />));

        cy.getDataCy('matchmaking-button-leave').click();

        cy.get('@onError').should('have.been.calledOnce');
    });
});
