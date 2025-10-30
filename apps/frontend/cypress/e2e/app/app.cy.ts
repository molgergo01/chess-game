describe('Main Page', () => {
    beforeEach(() => {
        cy.createTestUserForToken();
        cy.applyToken();
        cy.visit('http://localhost:3000/');
    });

    it('should redirect to play', () => {
        cy.url().should('contain', '/play');
    });

    describe('Theme Toggle', () => {
        it('should toggle theme', () => {
            cy.getDataCy('mode-toggle-dropdown').click();
            cy.getDataCy('dark-theme').click();
            cy.get('html').should('have.class', 'dark');

            cy.wait(500);

            cy.getDataCy('mode-toggle-dropdown').click();
            cy.getDataCy('light-theme').click();
            cy.get('html').should('have.class', 'light');

            cy.wait(500);

            cy.getDataCy('mode-toggle-dropdown').click();
            cy.getDataCy('system-theme').click();
            cy.window().then((win) => {
                const isDarkMode = win.matchMedia('(prefers-color-scheme: dark)').matches;

                if (isDarkMode) {
                    cy.get('html').should('have.class', 'dark');
                } else {
                    cy.get('html').should('have.class', 'light');
                }
            });
        });
    });
});
