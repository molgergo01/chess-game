describe('Sidebar', () => {
    beforeEach(() => {
        cy.applyToken();
        cy.visit('http://localhost:3000/');
    });

    describe('Sidebar navigation', () => {
        describe('Play button', () => {
            it('should navigate to play page', () => {
                cy.visit('http://localhost:3000/games/history');
                cy.getDataCy('sidebar-play').click();
                cy.url().should('include', '/play');
            });
        });

        describe('Leaderboard button', () => {
            it('should navigate to leaderboard page', () => {
                cy.getDataCy('sidebar-leaderboard').click();
                cy.url().should('include', '/leaderboard');
            });
        });

        describe('History button', () => {
            it('should navigate to history', () => {
                cy.getDataCy('sidebar-history').click();
                cy.url().should('include', '/games/history');
            });
        });
    });

    describe('Profile section', () => {
        describe('logout button', () => {
            it('should logout', () => {
                cy.getDataCy('sidebar-profile-toggle').click();
                cy.getDataCy('logout-button').click();
                cy.url().should('include', '/login');
                cy.getCookie('token').should('be.null');
            });
        });
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
