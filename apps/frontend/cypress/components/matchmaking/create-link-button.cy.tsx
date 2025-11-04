import CreateLinkButton from '@/components/matchmaking/create-link-button';
import { withAuthAndRouter } from '../../support/component';
import env from '@/lib/config/env';

describe('<CreateLinkButton />', () => {
    const mockQueueId = 'test-queue-id-123';

    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/auth/user/me`, {
            statusCode: 200,
            body: { id: 'test-user-123', name: 'Test User' }
        });

        cy.intercept('POST', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private`, {
            statusCode: 200,
            body: { queueId: mockQueueId }
        }).as('createPrivateQueue');
    });

    it('should render button with correct data-cy attribute', () => {
        cy.mount(withAuthAndRouter(<CreateLinkButton />));

        cy.getDataCy('matchmaking-button-invite-link').should('exist');
    });

    it('should be visible', () => {
        cy.mount(withAuthAndRouter(<CreateLinkButton />));

        cy.getDataCy('matchmaking-button-invite-link').should('be.visible');
    });

    it('should display "Play a Friend" text', () => {
        cy.mount(withAuthAndRouter(<CreateLinkButton />));

        cy.getDataCy('matchmaking-button-invite-link').should('contain.text', 'Play a Friend');
    });

    it('should call createPrivateQueue API when clicked', () => {
        cy.mount(withAuthAndRouter(<CreateLinkButton />));

        cy.getDataCy('matchmaking-button-invite-link').click();

        cy.wait('@createPrivateQueue');
    });

    it('should call onCreateLink callback with queueId on success', () => {
        const onCreateLink = cy.stub().as('onCreateLink');

        cy.mount(withAuthAndRouter(<CreateLinkButton onCreateLink={onCreateLink} />));

        cy.getDataCy('matchmaking-button-invite-link').click();

        cy.wait('@createPrivateQueue').then(() => {
            cy.get('@onCreateLink').should('have.been.calledOnceWith', mockQueueId);
        });
    });

    it('should call onError callback when API fails', () => {
        cy.intercept('POST', `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/private`, {
            statusCode: 500,
            body: { message: 'Internal server error' }
        }).as('createPrivateQueueError');

        const onError = cy.stub().as('onError');

        cy.mount(withAuthAndRouter(<CreateLinkButton onError={onError} />));

        cy.getDataCy('matchmaking-button-invite-link').click();

        cy.wait('@createPrivateQueueError').then(() => {
            cy.get('@onError').should('have.been.calledOnce');
        });
    });

    it('should allow multiple clicks', () => {
        const onCreateLink = cy.stub().as('onCreateLink');

        cy.mount(withAuthAndRouter(<CreateLinkButton onCreateLink={onCreateLink} />));

        cy.getDataCy('matchmaking-button-invite-link').click();
        cy.wait('@createPrivateQueue');

        cy.getDataCy('matchmaking-button-invite-link').click();
        cy.wait('@createPrivateQueue');

        cy.get('@onCreateLink').should('have.been.calledTwice');
    });
});
