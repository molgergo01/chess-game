describe('Login Flow', () => {
    it('Should redirect to /login if token is missing', () => {
        cy.visit('http://localhost:3000/');

        cy.url().should('include', '/login');
    });
    it('Should redirect to /login if invalid token is present', () => {
        cy.applyInvalidToken();
        cy.visit('http://localhost:3000/');

        cy.url().should('include', '/login');
    });
    it('Should redirect to google if login button is clicked', () => {
        cy.visit('http://localhost:3000/login');

        cy.getDataCy('login-button-google').click();

        cy.origin('https://accounts.google.com', () => {
            cy.url().should('include', 'https://accounts.google.com');
        });
    });
    it('Should not redirect after valid token is present', () => {
        cy.applyToken();
        cy.visit('http://localhost:3000/');

        cy.url().should('equal', 'http://localhost:3000/play');
    });
    context('Login alert', () => {
        it('Should render if login failed', () => {
            cy.visit('http://localhost:3000/login?failedLogin');

            cy.getDataCy('login-alert').should('exist');
        });
        it("Should not render if login didn't fail", () => {
            cy.visit('http://localhost:3000/login');

            cy.getDataCy('login-alert').should('not.exist');
        });
    });
});
