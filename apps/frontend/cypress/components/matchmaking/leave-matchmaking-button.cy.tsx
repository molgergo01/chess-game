import LeaveMatchmakingButton from '@/components/matchmaking/leave-matchmaking-button';
import { withAuthAndRouter } from '../../support/component';
import env from '@/lib/config/env';

describe('<LeaveMatchmakingButton />', () => {
    beforeEach(() => {
        // Mock getUser API for AuthProvider
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/user/me`, {
            statusCode: 200,
            body: { id: 'test-user-123', name: 'Test User' }
        });

        // Mock leaveQueue API
        cy.intercept(
            'DELETE',
            `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue/*`,
            {
                statusCode: 200
            }
        );

        cy.mount(withAuthAndRouter(<LeaveMatchmakingButton />));
    });

    it('should render button with correct data-cy attribute', () => {
        cy.getDataCy('matchmaking-button').should('exist');
    });

    it('should be visible', () => {
        cy.getDataCy('matchmaking-button').should('be.visible');
    });

    it('should display "Leave Queue" text', () => {
        cy.getDataCy('matchmaking-button').should(
            'contain.text',
            'Leave Queue'
        );
    });
});
