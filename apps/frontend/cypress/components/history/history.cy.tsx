import History from '@/components/history/history';
import { withAuthAndRouter } from '../../support/component';
import { GameHistory, Winner } from '@/lib/models/history/history';
import env from '@/lib/config/env';

describe('<History />', () => {
    const mockUserId = 'test-user-123';

    const mockGameHistory: GameHistory = {
        games: [
            {
                gameId: 'game-1',
                whitePlayer: {
                    userId: mockUserId,
                    name: 'Test User',
                    elo: 1500
                },
                blackPlayer: {
                    userId: 'opponent-1',
                    name: 'Opponent 1',
                    elo: 1600
                },
                startedAt: new Date('2025-01-15T10:00:00Z'),
                winner: Winner.WHITE
            },
            {
                gameId: 'game-2',
                whitePlayer: {
                    userId: 'opponent-2',
                    name: 'Opponent 2',
                    elo: 1400
                },
                blackPlayer: {
                    userId: mockUserId,
                    name: 'Test User',
                    elo: 1500
                },
                startedAt: new Date('2025-01-14T15:30:00Z'),
                winner: Winner.BLACK
            }
        ],
        totalCount: 2
    };

    beforeEach(() => {
        cy.stub(window, 'matchMedia').returns({
            matches: false,
            media: '',
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true
        });

        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/user/me`, {
            statusCode: 200,
            body: { id: mockUserId, name: 'Test User' }
        });
    });

    it('should show loading screen initially', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/games*`, {
            statusCode: 200,
            delay: 10000,
            body: { games: [], totalCount: 0 }
        });

        cy.mount(withAuthAndRouter(<History />));

        cy.getDataCy('loading-screen').should('be.visible');
    });

    it('should render table with game history', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/games*`, {
            statusCode: 200,
            body: {
                games: mockGameHistory.games.map((game) => ({
                    gameId: game.gameId,
                    whitePlayer: game.whitePlayer,
                    blackPlayer: game.blackPlayer,
                    startedAt: game.startedAt.toISOString(),
                    winner: game.winner
                })),
                totalCount: mockGameHistory.totalCount
            }
        });

        cy.mount(withAuthAndRouter(<History />));

        cy.contains('Test User').should('be.visible');
        cy.contains('Opponent 1').should('be.visible');
        cy.contains('Opponent 2').should('be.visible');
    });

    it('should display player cells correctly', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/games*`, {
            statusCode: 200,
            body: {
                games: mockGameHistory.games.map((game) => ({
                    gameId: game.gameId,
                    whitePlayer: game.whitePlayer,
                    blackPlayer: game.blackPlayer,
                    startedAt: game.startedAt.toISOString(),
                    winner: game.winner
                })),
                totalCount: mockGameHistory.totalCount
            }
        });

        cy.mount(withAuthAndRouter(<History />));

        cy.getDataCy('player-cell').should('have.length', 2);
    });

    it('should display winner cells correctly', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/games*`, {
            statusCode: 200,
            body: {
                games: mockGameHistory.games.map((game) => ({
                    gameId: game.gameId,
                    whitePlayer: game.whitePlayer,
                    blackPlayer: game.blackPlayer,
                    startedAt: game.startedAt.toISOString(),
                    winner: game.winner
                })),
                totalCount: mockGameHistory.totalCount
            }
        });

        cy.mount(withAuthAndRouter(<History />));

        cy.getDataCy('winner-cell').should('have.length', 2);
    });

    it('should show error alert on API failure', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/games*`, {
            statusCode: 500,
            body: { message: 'Failed to fetch history' }
        });

        cy.mount(withAuthAndRouter(<History />));

        cy.getDataCy('history-error-alert').should('be.visible');
        cy.contains('Failed to fetch history').should('be.visible');
    });

    it('should show pagination when multiple pages exist', () => {
        const largeGameHistory: GameHistory = {
            games: Array.from({ length: 10 }, (_, i) => ({
                gameId: `game-${i}`,
                whitePlayer: {
                    userId: mockUserId,
                    name: 'Test User',
                    elo: 1500
                },
                blackPlayer: {
                    userId: `opponent-${i}`,
                    name: `Opponent ${i}`,
                    elo: 1600
                },
                startedAt: new Date('2025-01-15T10:00:00Z'),
                winner: Winner.WHITE
            })),
            totalCount: 25
        };

        cy.intercept('GET', `${env.REST_URLS.CORE}/api/games*`, {
            statusCode: 200,
            body: {
                games: largeGameHistory.games.map((game) => ({
                    gameId: game.gameId,
                    whitePlayer: game.whitePlayer,
                    blackPlayer: game.blackPlayer,
                    startedAt: game.startedAt.toISOString(),
                    winner: game.winner
                })),
                totalCount: largeGameHistory.totalCount
            }
        });

        cy.mount(withAuthAndRouter(<History />));

        cy.getDataCy('pagination-nav-first').should('be.visible');
    });

    it('should hide pagination when only one page', () => {
        cy.intercept('GET', `${env.REST_URLS.CORE}/api/games*`, {
            statusCode: 200,
            body: {
                games: mockGameHistory.games.map((game) => ({
                    gameId: game.gameId,
                    whitePlayer: game.whitePlayer,
                    blackPlayer: game.blackPlayer,
                    startedAt: game.startedAt.toISOString(),
                    winner: game.winner
                })),
                totalCount: mockGameHistory.totalCount
            }
        });

        cy.mount(withAuthAndRouter(<History />));

        cy.getDataCy('pagination-nav-first').should('not.be.visible');
    });
});
