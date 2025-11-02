import Game from '@/components/game/game';
import { withAllProviders } from '../../support/component';
import env from '@/lib/config/env';
import { Color } from '@/lib/models/response/game';
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

    describe('game controls', () => {
        beforeEach(() => {
            cy.intercept('GET', `${env.REST_URLS.CORE}/api/games/active*`, {
                statusCode: 200,
                body: mockActiveGameData
            }).as('getActiveGame');

            cy.mount(withAllProviders(<Game />));
            cy.wait('@getUser');
            cy.wait('@getActiveGame');
        });

        it('should render game controls component', () => {
            cy.getDataCy('game-controls').should('be.visible');
        });
    });

    describe('game state variations', () => {
        it('should render when game is not started', () => {
            cy.intercept('GET', `${env.REST_URLS.CORE}/api/games/active*`, {
                statusCode: 200,
                body: {
                    ...mockActiveGameData,
                    position: Fen.startingPosition
                }
            }).as('getActiveGame');

            cy.mount(withAllProviders(<Game />));
            cy.wait('@getUser');
            cy.wait('@getActiveGame');

            cy.getDataCy('game-container').should('be.visible');
            cy.getDataCy('game-chessboard-container').should('be.visible');
        });

        it('should render when game is in progress with different position', () => {
            cy.intercept('GET', `${env.REST_URLS.CORE}/api/games/active*`, {
                statusCode: 200,
                body: {
                    ...mockActiveGameData,
                    position: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
                }
            }).as('getActiveGame');

            cy.mount(withAllProviders(<Game />));
            cy.wait('@getUser');
            cy.wait('@getActiveGame');

            cy.getDataCy('game-container').should('be.visible');
            cy.getDataCy('game-chessboard-container').should('be.visible');
        });

        it('should render game controls when draw offer is present', () => {
            cy.intercept('GET', `${env.REST_URLS.CORE}/api/games/active*`, {
                statusCode: 200,
                body: {
                    ...mockActiveGameData,
                    drawOffer: {
                        offeredBy: Color.BLACK,
                        expiresAt: Date.now() + 30000
                    }
                }
            }).as('getActiveGame');

            cy.mount(withAllProviders(<Game />));
            cy.wait('@getUser');
            cy.wait('@getActiveGame');

            cy.getDataCy('game-controls').should('be.visible');
        });
    });
});
