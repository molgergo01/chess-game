import LoginForm from '@/components/login/login-form';
import { withAppRouter } from '../../support/component';

describe('<LoginForm />', () => {
    beforeEach(() => {
        cy.mount(withAppRouter(<LoginForm />));
    });

    it('should render with necessary elements', () => {
        cy.getDataCy('login-form').should('be.visible');
        cy.getDataCy('login-button-google').should('be.visible');
        cy.getDataCy('login-board-image').should('be.visible');
        cy.getDataCy('login-header').should('be.visible');
        cy.getDataCy('login-subheader').should('be.visible');
    });

    it('should not render image on mobile', () => {
        cy.viewport('iphone-6');
        cy.getDataCy('login-board-image')
            .should('exist')
            .should('not.be.visible');
    });
});
