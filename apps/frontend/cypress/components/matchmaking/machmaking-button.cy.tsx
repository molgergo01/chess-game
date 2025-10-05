import MatchmakingButton from '@/components/matchmaking/machmaking-button';
import { withAuthAndRouter } from '../../support/component';
import env from '@/lib/config/env';

describe('<MatchmakingButton />', () => {
    beforeEach(() => {
        // Mock getUser API for AuthProvider
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/user/me`, {
            statusCode: 200,
            body: { id: 'test-user-123', name: 'Test User' }
        });

        // Mock joinQueue API
        cy.intercept(
            'POST',
            `${env.REST_URLS.MATCHMAKING}/api/matchmaking/queue`,
            {
                statusCode: 200
            }
        );

        cy.mount(withAuthAndRouter(<MatchmakingButton />));
    });

    it('should render button with correct data-cy attribute', () => {
        cy.getDataCy('matchmaking-button').should('exist');
    });

    it('should be visible', () => {
        cy.getDataCy('matchmaking-button').should('be.visible');
    });

    it('should display "Queue" text', () => {
        cy.getDataCy('matchmaking-button').should('contain.text', 'Queue');
    });
});
