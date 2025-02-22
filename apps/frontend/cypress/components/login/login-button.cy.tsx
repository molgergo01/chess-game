import React from 'react';
import LoginButton from '@/components/login/login-button';

describe('<LoginButton />', () => {
    beforeEach(() => {
        cy.mount(<LoginButton />);
    });

    it('should render', () => {
        cy.getDataCy('login-button-google')
            .should('be.visible')
            .should('have.text', 'Login with Google');
    });

    it('should have onClick', () => {
        cy.get('[data-cy="login-button-google"]')
            .should('have.prop', 'onclick')
            .and('be.a', 'function');
    });
});
