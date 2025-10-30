import { v4 as uuid } from 'uuid';

describe('/games/[gameId] Page', () => {
    const testUserId = 'test-user-authenticated';
    const testUser2Id = 'test-user-opponent';

    beforeEach(() => {
        cy.cleanupTestData();
    });

    describe('Authentication & Page Access', () => {
        it('Should redirect to /login if token is missing', () => {
            const testGameId = uuid();
            cy.clearCookies();
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.url().should('include', '/login');
        });
    });

    describe('Game Details Display', () => {
        const testGameId = uuid();

        beforeEach(() => {
            cy.createTestUserForToken();
            cy.applyToken();

            cy.createUser({
                userId: testUserId,
                name: 'Test User',
                email: 'test@example.com',
                elo: 1500
            });

            cy.createUser({
                userId: testUser2Id,
                name: 'Opponent User',
                email: 'opponent@example.com',
                elo: 1600
            });

            cy.createGame({
                gameId: testGameId,
                whiteUserId: testUserId,
                blackUserId: testUser2Id,
                winner: 'w',
                startedAt: new Date('2025-01-15T10:00:00Z'),
                endedAt: new Date('2025-01-15T10:30:00Z')
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 1,
                playerColor: 'w',
                moveNotation: 'e4',
                positionFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                whitePlayerTime: 595000,
                blackPlayerTime: 600000
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 1,
                playerColor: 'b',
                moveNotation: 'e5',
                positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
                whitePlayerTime: 595000,
                blackPlayerTime: 592000
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 2,
                playerColor: 'w',
                moveNotation: 'Nf3',
                positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
                whitePlayerTime: 590000,
                blackPlayerTime: 592000
            });

            cy.createMove({
                gameId: testGameId,
                moveId: uuid(),
                moveNumber: 2,
                playerColor: 'b',
                moveNotation: 'Nc6',
                positionFen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
                whitePlayerTime: 590000,
                blackPlayerTime: 585000
            });
        });

        it('Should load game details page with valid game ID', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('game-history-container').should('be.visible');
        });

        it('Should show chessboard', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('game-chessboard-container').should('be.visible');
        });

        it('Should display move history panel', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('game-history-details').should('be.visible');
            cy.getDataCy('history-details').should('be.visible');
        });

        it('Should show player names', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('game-history-container').should('contain', 'Test User');
            cy.getDataCy('game-history-container').should('contain', 'Opponent User');
        });

        it('Should show player ELO ratings', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('game-history-container').should('contain', '1500');
            cy.getDataCy('game-history-container').should('contain', '1600');
        });

        it('Should display all moves in move history', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-move-pair-1').should('be.visible');
            cy.getDataCy('history-move-pair-2').should('be.visible');
        });

        it('Should show move notations correctly', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-move-white-1').should('contain', 'e4');
            cy.getDataCy('history-move-black-1').should('contain', 'e5');
            cy.getDataCy('history-move-white-2').should('contain', 'Nf3');
            cy.getDataCy('history-move-black-2').should('contain', 'Nc6');
        });

        it('Should show starting position option', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-initial-position').should('be.visible');
            cy.getDataCy('history-initial-position').should('contain', 'Starting Position');
        });
    });

    describe('Move Navigation by Clicking', () => {
        const testGameId = uuid();

        beforeEach(() => {
            cy.createTestUserForToken();
            cy.applyToken();

            cy.createUser({
                userId: testUserId,
                name: 'Test User',
                email: 'test@example.com',
                elo: 1500
            });

            cy.createUser({
                userId: testUser2Id,
                name: 'Opponent User',
                email: 'opponent@example.com',
                elo: 1600
            });

            cy.createGame({
                gameId: testGameId,
                whiteUserId: testUserId,
                blackUserId: testUser2Id,
                winner: 'w',
                startedAt: new Date('2025-01-15T10:00:00Z'),
                endedAt: new Date('2025-01-15T10:30:00Z')
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 1,
                playerColor: 'w',
                moveNotation: 'e4',
                positionFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                whitePlayerTime: 595000,
                blackPlayerTime: 600000
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 1,
                playerColor: 'b',
                moveNotation: 'e5',
                positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
                whitePlayerTime: 595000,
                blackPlayerTime: 592000
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 2,
                playerColor: 'w',
                moveNotation: 'Nf3',
                positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
                whitePlayerTime: 590000,
                blackPlayerTime: 592000
            });
        });

        it('Should highlight the last move by default', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-move-white-2').should('have.class', 'bg-primary');
        });

        it('Should navigate to starting position when clicking on it', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-initial-position').click();

            cy.getDataCy('history-initial-position').should('have.class', 'bg-primary');
        });

        it('Should update board position when selecting first move', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-move-white-1').click();

            cy.getDataCy('history-move-white-1').should('have.class', 'bg-primary');
        });

        it('Should navigate through moves by clicking', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-move-white-1').click();
            cy.getDataCy('history-move-white-1').should('have.class', 'bg-primary');

            cy.getDataCy('history-move-black-1').click();
            cy.getDataCy('history-move-black-1').should('have.class', 'bg-primary');

            cy.getDataCy('history-move-white-2').click();
            cy.getDataCy('history-move-white-2').should('have.class', 'bg-primary');
        });

        it('Should update move highlight when clicking different moves', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-move-white-1').click();
            cy.getDataCy('history-move-white-1').should('have.class', 'bg-primary');
            cy.getDataCy('history-move-white-2').should('not.have.class', 'bg-primary');

            cy.getDataCy('history-move-white-2').click();
            cy.getDataCy('history-move-white-2').should('have.class', 'bg-primary');
            cy.getDataCy('history-move-white-1').should('not.have.class', 'bg-primary');
        });
    });

    describe('Move Navigation with Arrow Keys', () => {
        const testGameId = uuid();

        beforeEach(() => {
            cy.createTestUserForToken();
            cy.applyToken();

            cy.createUser({
                userId: testUserId,
                name: 'Test User',
                email: 'test@example.com',
                elo: 1500
            });

            cy.createUser({
                userId: testUser2Id,
                name: 'Opponent User',
                email: 'opponent@example.com',
                elo: 1600
            });

            cy.createGame({
                gameId: testGameId,
                whiteUserId: testUserId,
                blackUserId: testUser2Id,
                winner: 'w',
                startedAt: new Date('2025-01-15T10:00:00Z'),
                endedAt: new Date('2025-01-15T10:30:00Z')
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 1,
                playerColor: 'w',
                moveNotation: 'e4',
                positionFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                whitePlayerTime: 595000,
                blackPlayerTime: 600000
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 1,
                playerColor: 'b',
                moveNotation: 'e5',
                positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
                whitePlayerTime: 595000,
                blackPlayerTime: 592000
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 2,
                playerColor: 'w',
                moveNotation: 'Nf3',
                positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
                whitePlayerTime: 590000,
                blackPlayerTime: 592000
            });
        });

        it('Should navigate backward with left arrow key', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.get('body').click();
            cy.get('body').type('{leftArrow}');

            cy.getDataCy('history-move-black-1').should('have.class', 'bg-primary');
        });

        it('Should navigate forward with right arrow key', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-move-white-1').click();

            cy.get('body').click();
            cy.get('body').type('{rightArrow}');

            cy.getDataCy('history-move-black-1').should('have.class', 'bg-primary');
        });

        it('Should navigate to starting position with multiple left arrows', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.get('body').click();
            cy.get('body').type('{leftArrow}').wait(100).type('{leftArrow}').wait(100).type('{leftArrow}').wait(100);

            cy.getDataCy('history-initial-position').should('have.class', 'bg-primary');
        });

        it('Should navigate to last move with multiple right arrows', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-initial-position').click();

            cy.get('body').click();
            cy.get('body').type('{rightArrow}').wait(100).type('{rightArrow}').wait(100).type('{rightArrow}').wait(100);

            cy.getDataCy('history-move-white-2').should('have.class', 'bg-primary');
        });

        it('Should not go beyond starting position with left arrow', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-initial-position').click();
            cy.get('body').click();
            cy.get('body').type('{leftArrow}');

            cy.getDataCy('history-initial-position').should('have.class', 'bg-primary');
        });

        it('Should not go beyond last move with right arrow', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.get('body').click();
            cy.get('body').type('{rightArrow}');

            cy.getDataCy('history-move-white-2').should('have.class', 'bg-primary');
        });
    });

    describe('Move Timing Display', () => {
        const testGameId = uuid();

        beforeEach(() => {
            cy.createTestUserForToken();
            cy.applyToken();

            cy.createUser({
                userId: testUserId,
                name: 'Test User',
                email: 'test@example.com',
                elo: 1500
            });

            cy.createUser({
                userId: testUser2Id,
                name: 'Opponent User',
                email: 'opponent@example.com',
                elo: 1600
            });

            cy.createGame({
                gameId: testGameId,
                whiteUserId: testUserId,
                blackUserId: testUser2Id,
                winner: 'w',
                startedAt: new Date('2025-01-15T10:00:00Z'),
                endedAt: new Date('2025-01-15T10:30:00Z')
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 1,
                playerColor: 'w',
                moveNotation: 'e4',
                positionFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                whitePlayerTime: 595000,
                blackPlayerTime: 600000
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 1,
                playerColor: 'b',
                moveNotation: 'e5',
                positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
                whitePlayerTime: 595000,
                blackPlayerTime: 592000
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 2,
                playerColor: 'w',
                moveNotation: 'Nf3',
                positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
                whitePlayerTime: 590000,
                blackPlayerTime: 592000
            });
        });

        it('Should show time spent on moves', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-move-black-1').should('contain', '0:08');
        });

        it('Should show correct time format', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-move-white-2').should('contain', '0:05');
        });
    });

    describe('Pagination in Move History', () => {
        const testGameId = uuid();

        beforeEach(() => {
            cy.createTestUserForToken();
            cy.applyToken();

            cy.createUser({
                userId: testUserId,
                name: 'Test User',
                email: 'test@example.com',
                elo: 1500
            });

            cy.createUser({
                userId: testUser2Id,
                name: 'Opponent User',
                email: 'opponent@example.com',
                elo: 1600
            });

            cy.createGame({
                gameId: testGameId,
                whiteUserId: testUserId,
                blackUserId: testUser2Id,
                winner: 'w',
                startedAt: new Date('2025-01-15T10:00:00Z'),
                endedAt: new Date('2025-01-15T10:30:00Z')
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 1,
                playerColor: 'w',
                moveNotation: 'e4',
                positionFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                whitePlayerTime: 595000,
                blackPlayerTime: 600000
            });

            cy.createMove({
                moveId: uuid(),
                gameId: testGameId,
                moveNumber: 1,
                playerColor: 'b',
                moveNotation: 'e5',
                positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
                whitePlayerTime: 595000,
                blackPlayerTime: 592000
            });
        });

        it('Should show pagination controls in history details', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-pagination').should('exist');
        });

        it('Should navigate with pagination first button', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('pagination-nav-first').click();

            cy.getDataCy('history-initial-position').should('have.class', 'bg-primary');
        });

        it('Should navigate with pagination previous button', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('pagination-nav-previous').click();

            cy.getDataCy('history-move-white-1').should('have.class', 'bg-primary');
        });

        it('Should navigate with pagination next button', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-initial-position').click();
            cy.getDataCy('pagination-nav-next').click();

            cy.getDataCy('history-move-white-1').should('have.class', 'bg-primary');
        });

        it('Should navigate with pagination last button', () => {
            cy.visit(`http://localhost:3000/games/${testGameId}`);

            cy.getDataCy('history-initial-position').click();
            cy.getDataCy('pagination-nav-last').click();

            cy.getDataCy('history-move-black-1').should('have.class', 'bg-primary');
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            cy.createTestUserForToken();
            cy.applyToken();
        });

        it('Should show 404 for non-existent game', () => {
            cy.visit(`http://localhost:3000/games/${uuid()}`, { failOnStatusCode: false });

            cy.get('body').should('contain', '404');
        });

        it('Should handle invalid game ID format', () => {
            cy.visit('http://localhost:3000/games/invalid-id-format', { failOnStatusCode: false });

            cy.get('body').should('contain', '404');
        });
    });
});
