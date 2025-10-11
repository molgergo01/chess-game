import Game from '@/components/game/game';
import { withAllProviders } from '../../support/component';
import env from '@/lib/config/env';

describe('<Game />', () => {
    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/user/me`, {
            statusCode: 200,
            body: { id: 'test-user-123', name: 'Test User' }
        });
    });

    it('should render loading screen when game state is not ready', () => {
        cy.mount(withAllProviders(<Game />));

        cy.getDataCy('loading-screen').should('be.visible');
        cy.getDataCy('spinner').should('be.visible');
    });
});
