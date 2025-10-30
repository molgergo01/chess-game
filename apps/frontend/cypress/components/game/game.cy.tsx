import Game from '@/components/game/game';
import { withAllProviders } from '../../support/component';
import env from '@/lib/config/env';
import { Winner } from '@/lib/models/response/game';
import Fen from 'chess-fen';

describe('<Game />', () => {
    const mockActiveGameData = {
        gameId: 'test-game-123',
        whitePlayer: {
            userId: 'white-user-id',
            name: 'White Player',
            elo: 1500,
            avatarUrl: null
        },
        blackPlayer: {
            userId: 'black-user-id',
            name: 'Black Player',
            elo: 1600,
            avatarUrl: null
        },
        position: Fen.startingPosition,
        whiteTimeRemaining: 600000,
        blackTimeRemaining: 600000,
        gameOver: false,
        winner: null
    };

    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/user/me*`, {
            statusCode: 200,
            body: {
                user: {
                    id: 'white-user-id',
                    name: 'White Player',
                    email: 'white@example.com',
                    elo: 1500,
                    avatarUrl: null
                }
            }
        }).as('getUser');
    });

    describe('loading state', () => {
        it('should render loading screen when API call is pending', () => {
            cy.intercept('GET', `${env.REST_URLS.CORE}/api/games/active*`, (req) => {
                req.reply(() => new Promise(() => {}));
            });

            cy.mount(withAllProviders(<Game />));

            cy.getDataCy('loading-screen').should('be.visible');
            cy.getDataCy('spinner').should('be.visible');
        });
    });

    describe('active game rendering', () => {
        beforeEach(() => {
            cy.intercept('GET', `${env.REST_URLS.CORE}/api/games/active*`, {
                statusCode: 200,
                body: mockActiveGameData
            }).as('getActiveGame');

            cy.mount(withAllProviders(<Game />));
            cy.wait('@getUser');
            cy.wait('@getActiveGame');
        });

        it('should render game container', () => {
            cy.getDataCy('game-container').should('be.visible');
        });

        it('should not render loading screen', () => {
            cy.getDataCy('loading-screen').should('not.exist');
        });

        it('should render chessboard with banners', () => {
            cy.getDataCy('game-chessboard-container').should('be.visible');
        });

        it('should render chatbox', () => {
            cy.getDataCy('game-chatbox').should('be.visible');
        });

        it('should not show game over dialog', () => {
            cy.get('[data-state="open"]').should('not.exist');
        });
    });

    describe('game over dialog', () => {
        it('should show dialog with "White wins" message when white wins', () => {
            cy.intercept('GET', `${env.REST_URLS.CORE}/api/games/active*`, {
                statusCode: 200,
                body: {
                    ...mockActiveGameData,
                    gameOver: true,
                    winner: Winner.WHITE
                }
            }).as('getActiveGame');

            cy.mount(withAllProviders(<Game />));
            cy.wait('@getUser');
            cy.wait('@getActiveGame');

            cy.get('[data-state="open"]').should('exist');
            cy.getDataCy('game-over-message').should('be.visible').and('contain.text', 'White wins');
        });

        it('should show dialog with "Black wins" message when black wins', () => {
            cy.intercept('GET', `${env.REST_URLS.CORE}/api/games/active*`, {
                statusCode: 200,
                body: {
                    ...mockActiveGameData,
                    gameOver: true,
                    winner: Winner.BLACK
                }
            }).as('getActiveGame');

            cy.mount(withAllProviders(<Game />));
            cy.wait('@getUser');
            cy.wait('@getActiveGame');

            cy.get('[data-state="open"]').should('exist');
            cy.getDataCy('game-over-message').should('be.visible').and('contain.text', 'Black wins');
        });

        it('should show dialog with "Draw" message when game is a draw', () => {
            cy.intercept('GET', `${env.REST_URLS.CORE}/api/games/active*`, {
                statusCode: 200,
                body: {
                    ...mockActiveGameData,
                    gameOver: true,
                    winner: Winner.DRAW
                }
            }).as('getActiveGame');

            cy.mount(withAllProviders(<Game />));
            cy.wait('@getUser');
            cy.wait('@getActiveGame');

            cy.get('[data-state="open"]').should('exist');
            cy.getDataCy('game-over-message').should('be.visible').and('contain.text', 'Draw');
        });
    });
});
