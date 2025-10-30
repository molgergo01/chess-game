import { v4 as uuid } from 'uuid';

describe('/games/history Page', () => {
    const testUserId = 'test-user-authenticated';
    const testUser2Id = 'test-user-opponent';

    beforeEach(() => {
        cy.cleanupTestData();
    });

    describe('Authentication & Page Access', () => {
        it('Should redirect to /login if token is missing', () => {
            cy.clearCookies();
            cy.visit('http://localhost:3000/games/history');

            cy.url().should('include', '/login');
        });

        it('Should load history page with valid token', () => {
            cy.createTestUserForToken();
            cy.applyToken();
            cy.visit('http://localhost:3000/games/history');

            cy.url().should('equal', 'http://localhost:3000/games/history');
        });
    });

    describe('Empty State', () => {
        beforeEach(() => {
            cy.createTestUserForToken();
            cy.applyToken();
        });

        it('Should display table with no games when user has no history', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-table').should('exist');
            cy.getDataCy('history-table-body').find('tr').should('have.length', 0);
        });

        it('Should show "0 - 0 of 0 games" in caption when no games exist', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-table-caption').should('contain', 'Showing 0 - 0 of 0 games');
        });

        it('Should not show pagination when there are no games', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-pagination').should('have.class', 'hidden');
        });
    });

    describe('Game List Display', () => {
        beforeEach(() => {
            cy.createTestUserForToken();
            cy.applyToken();

            cy.createUser({
                userId: testUser2Id,
                name: 'Opponent User',
                email: 'opponent@example.com',
                elo: 1600
            });

            cy.createGame({
                gameId: uuid(),
                whiteUserId: testUserId,
                blackUserId: testUser2Id,
                winner: 'w',
                startedAt: new Date('2025-01-15T10:00:00Z'),
                endedAt: new Date('2025-01-15T10:30:00Z')
            });

            cy.createGame({
                gameId: uuid(),
                whiteUserId: testUserId,
                blackUserId: testUser2Id,
                winner: 'b',
                startedAt: new Date('2025-01-14T10:00:00Z'),
                endedAt: new Date('2025-01-14T10:30:00Z')
            });

            cy.createGame({
                gameId: uuid(),
                whiteUserId: testUserId,
                blackUserId: testUser2Id,
                winner: 'd',
                startedAt: new Date('2025-01-13T10:00:00Z'),
                endedAt: new Date('2025-01-13T10:30:00Z')
            });
        });

        it('Should display correct number of games', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-table-row').should('have.length', 3);
        });

        it('Should show player names correctly', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('player-cell').should('have.length', 3);
            cy.getDataCy('player-cell-white').first().should('contain', 'Test User');
            cy.getDataCy('player-cell-black').first().should('contain', 'Opponent User');
        });

        it('Should show ELO ratings for players', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('player-cell-white').first().should('contain', '1500');
            cy.getDataCy('player-cell-black').first().should('contain', '1600');
        });

        it('Should format dates correctly', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-table-row').first().should('contain', '2025-01-15');
        });

        it('Should display correct table headers', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-table').find('thead th').eq(0).should('contain', 'Players');
            cy.getDataCy('history-table').find('thead th').eq(1).should('contain', 'Date');
            cy.getDataCy('history-table').find('thead th').eq(2).should('contain', 'Result');
        });

        it('Should show winner indicator for win', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('winner-cell').first().should('have.class', 'bg-green-500');
            cy.getDataCy('winner-cell').first().should('contain', '+');
        });

        it('Should show winner indicator for loss', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('winner-cell').eq(1).should('have.class', 'bg-red-500');
            cy.getDataCy('winner-cell').eq(1).should('contain', '-');
        });

        it('Should show winner indicator for draw', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('winner-cell').eq(2).should('have.class', 'bg-gray-500');
            cy.getDataCy('winner-cell').eq(2).should('contain', '=');
        });
    });

    describe('Pagination', () => {
        beforeEach(() => {
            cy.createTestUserForToken();
            cy.applyToken();

            cy.createUser({
                userId: testUser2Id,
                name: 'Opponent User',
                email: 'opponent@example.com',
                elo: 1600
            });

            for (let i = 1; i <= 20; i++) {
                cy.createGame({
                    gameId: uuid(),
                    whiteUserId: testUserId,
                    blackUserId: testUser2Id,
                    winner: 'w',
                    startedAt: new Date(`2025-01-${String(i).padStart(2, '0')}T10:00:00Z`),
                    endedAt: new Date(`2025-01-${String(i).padStart(2, '0')}T10:30:00Z`)
                });
            }
        });

        it('Should show pagination when there are more than 15 games', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-pagination').should('be.visible');
        });

        it('Should navigate to next page', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-pagination').contains('button', '2').click();

            cy.getDataCy('history-table-row').should('have.length', 5);
        });

        it('Should update table caption with correct range on page 1', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-table-caption').should('contain', 'Showing 1 - 15 of 20 games');
        });

        it('Should update table caption with correct range on page 2', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-pagination').contains('button', '2').click();

            cy.getDataCy('history-table-caption').should('contain', 'Showing 16 - 20 of 20 games');
        });

        it('Should navigate to previous page', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-pagination').contains('button', '2').click();
            cy.getDataCy('history-table-row').should('have.length', 5);

            cy.getDataCy('history-pagination').contains('button', '1').click();
            cy.getDataCy('history-table-row').should('have.length', 15);
        });

        it('Should load correct games for each page', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-table-row').first().should('exist');
            const firstPageFirstGame = cy.getDataCy('history-table-row').first();

            cy.getDataCy('history-pagination').contains('button', '2').click();

            cy.getDataCy('history-table-row').first().should('not.equal', firstPageFirstGame);
        });
    });

    describe('Game Links', () => {
        const gameId = uuid();
        beforeEach(() => {
            cy.createTestUserForToken();
            cy.applyToken();

            cy.createUser({
                userId: testUser2Id,
                name: 'Opponent User',
                email: 'opponent@example.com',
                elo: 1600
            });

            cy.createGame({
                gameId: gameId,
                whiteUserId: testUserId,
                blackUserId: testUser2Id,
                winner: 'w',
                startedAt: new Date('2025-01-15T10:00:00Z'),
                endedAt: new Date('2025-01-15T10:30:00Z')
            });
        });

        it('Should navigate to game detail page when clicking on a game row', () => {
            cy.visit('http://localhost:3000/games/history');

            cy.getDataCy('history-table-row').first().find('a').first().click();

            cy.url().should('include', `/games/${gameId}`);
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            cy.createTestUserForToken();
            cy.applyToken();
        });

        it('Should display error alert when API fails', () => {
            cy.intercept('GET', '**/api/games*', {
                statusCode: 500,
                body: { message: 'Internal server error' }
            }).as('getGamesError');

            cy.visit('http://localhost:3000/games/history');

            cy.wait('@getGamesError');
            cy.getDataCy('history-error-alert').should('be.visible');
        });

        it('Should show appropriate error message', () => {
            cy.intercept('GET', '**/api/games*', {
                statusCode: 500,
                body: { message: 'Database connection failed' }
            }).as('getGamesError');

            cy.visit('http://localhost:3000/games/history');

            cy.wait('@getGamesError');
            cy.getDataCy('history-error-alert').should('contain', 'Database connection failed');
        });
    });
});
