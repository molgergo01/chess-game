// Cypress does not let you test two concurrent browsers, so matchmaking can not be properly tested...

describe('/play Page', () => {
    beforeEach(function () {
        cy.applyToken();
        if (
            !this.currentTest?.title.includes('Should join private queue') &&
            !this.currentTest?.title.includes('Should remove query parameter') &&
            !this.currentTest?.title.includes('Should display error alert')
        ) {
            cy.visit('http://localhost:3000/play');
            cy.getDataCy('matchmaking-card').should('exist');
            cy.get('body').then(($body) => {
                if ($body.find('[data-cy=matchmaking-button-leave]').length > 0) {
                    cy.getDataCy('matchmaking-button-leave').click();
                    cy.wait(500);
                }
            });
        }
    });

    describe('Authentication & Page Access', () => {
        it('Should redirect to /login if token is missing', () => {
            cy.clearCookies();
            cy.visit('http://localhost:3000/play');

            cy.url().should('include', '/login');
        });

        it('Should load matchmaking page with valid token', () => {
            cy.visit('http://localhost:3000/play');

            cy.url().should('equal', 'http://localhost:3000/play');
            cy.getDataCy('matchmaking-card').should('exist');
        });
    });

    describe('Initial Page Render', () => {
        beforeEach(() => {
            cy.visit('http://localhost:3000/play');
        });

        it('Should display "Play Chess" header', () => {
            cy.getDataCy('matchmaking-header').should('contain', 'Play Chess');
        });

        it('Should show matchmaking card when loaded', () => {
            cy.getDataCy('matchmaking-card').should('be.visible');
        });

        it('Should display matchmaking buttons when not queued', () => {
            cy.getDataCy('matchmaking-button-join').should('be.visible');
            cy.getDataCy('matchmaking-button-invite-link').should('be.visible');
        });
    });

    describe('Join Public Queue Flow', () => {
        beforeEach(() => {
            cy.visit('http://localhost:3000/play');
        });

        it('Should join public queue successfully', () => {
            cy.getDataCy('matchmaking-button-join').click();

            cy.getDataCy('matchmaking-searching-text').should('contain', 'Searching for an opponent...');
        });

        it('Should show "Searching for an opponent..." text', () => {
            cy.getDataCy('matchmaking-button-join').click();

            cy.getDataCy('matchmaking-searching-text').should('be.visible');
        });

        it('Should display "Leave Queue" button', () => {
            cy.getDataCy('matchmaking-button-join').click();

            cy.getDataCy('matchmaking-button-leave').should('be.visible');
        });

        it('Should leave public queue successfully', () => {
            cy.getDataCy('matchmaking-button-join').click();
            cy.getDataCy('matchmaking-button-leave').should('be.visible');

            cy.getDataCy('matchmaking-button-leave').click();

            cy.getDataCy('matchmaking-button-join').should('be.visible');
            cy.getDataCy('matchmaking-button-leave').should('not.exist');
        });
    });

    describe('Create Private Queue (Invite Link) Flow', () => {
        beforeEach(() => {
            cy.visit('http://localhost:3000/play', {
                onBeforeLoad(win) {
                    cy.stub(win.navigator.clipboard, 'writeText').resolves();
                }
            });
        });

        it('Should create private queue successfully', () => {
            cy.getDataCy('matchmaking-button-invite-link').click();

            cy.getDataCy('matchmaking-invite-link-container').should('be.visible');

            cy.getDataCy('matchmaking-button-leave').click();
        });

        it('Should display copyable invite link', () => {
            cy.getDataCy('matchmaking-button-invite-link').click();

            cy.getDataCy('matchmaking-invite-link-container').should('be.visible');
            cy.getDataCy('matchmaking-invite-link').invoke('val').should('include', '/play?id=');

            cy.getDataCy('matchmaking-button-leave').click();
        });

        it('Should show "Waiting for friend to join..." text', () => {
            cy.getDataCy('matchmaking-button-invite-link').click();

            cy.getDataCy('matchmaking-waiting-text').should('contain', 'Waiting for friend to join...');

            cy.getDataCy('matchmaking-button-leave').click();
        });

        it('Should have copy button that changes to "Copied!"', () => {
            cy.getDataCy('matchmaking-button-invite-link').click();

            cy.getDataCy('matchmaking-copy-link-button').should('contain', 'Copied!');
            cy.wait(2100);
            cy.getDataCy('matchmaking-copy-link-button').should('contain', 'Copy');

            cy.getDataCy('matchmaking-button-leave').click();
        });

        it('Should cancel private queue successfully', () => {
            cy.getDataCy('matchmaking-button-invite-link').click();
            cy.getDataCy('matchmaking-button-leave').should('be.visible');

            cy.getDataCy('matchmaking-button-leave').click();

            cy.getDataCy('matchmaking-button-join').should('be.visible');
            cy.getDataCy('matchmaking-button-leave').should('not.exist');
        });
    });

    describe('Join Private Queue via URL Parameter', () => {
        it('Should show error for invalid queue ID', () => {
            cy.visit('http://localhost:3000/play?id=invalid-queue-id');

            cy.getDataCy('matchmaking-error-alert').should('be.visible');
        });
    });

    describe('Error Handling', () => {
        it('Should display error alert and auto-dismiss after 5 seconds', () => {
            cy.applyToken();
            cy.visit('http://localhost:3000/play?id=invalid-queue-id');

            cy.getDataCy('matchmaking-error-alert').should('be.visible');

            cy.wait(5100);

            cy.getDataCy('matchmaking-error-alert').should('not.exist');
        });
    });
});
