import Game from '@/components/game/game';
import { withAllProviders } from '../../support/component';
import * as useChessGameHook from '@/hooks/chess/useChessGame';
import Fen from 'chess-fen';
import { Color } from '@/lib/models/request/matchmaking';
import env from '@/lib/config/env';

describe('<Game />', () => {
    const getMockChessGameState = () => ({
        color: Color.WHITE,
        boardPosition: new Fen(Fen.startingPosition),
        turnColor: Color.WHITE,
        timesRemaining: {
            whiteTimeRemaining: 600000,
            blackTimeRemaining: 600000
        },
        gameOver: false,
        winner: null,
        onDrop: () => {}
    });

    beforeEach(() => {
        // Mock auth API
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/user/me`, {
            statusCode: 200,
            body: { id: 'test-user-123', name: 'Test User' }
        });

        // Set up localStorage with playerData for getCurrentUserColor
        const playerData = [
            { id: 'test-user-123', color: 'w' },
            { id: 'opponent-456', color: 'b' }
        ];
        cy.window().then((win) => {
            win.localStorage.setItem('playerData', JSON.stringify(playerData));
        });
    });

    describe('Desktop viewport', () => {
        beforeEach(() => {
            cy.viewport(1280, 720);
        });

        it('should render main game container', () => {
            cy.stub(useChessGameHook, 'default').returns(getMockChessGameState());

            cy.mount(withAllProviders(<Game />));
            cy.getDataCy('game-container').should('be.visible');
        });

        it('should render chessboard', () => {
            cy.stub(useChessGameHook, 'default').returns(getMockChessGameState());

            cy.mount(withAllProviders(<Game />));
            cy.getDataCy('game-chessboard-container').should('be.visible');
        });

        it('should render chat box', () => {
            cy.stub(useChessGameHook, 'default').returns(getMockChessGameState());

            cy.mount(withAllProviders(<Game />));
            cy.getDataCy('game-chatbox').should('be.visible');
        });

        it('should render desktop banners', () => {
            cy.stub(useChessGameHook, 'default').returns(getMockChessGameState());

            cy.mount(withAllProviders(<Game />));
            cy.getDataCy('game-desktop-banner-top').should('be.visible');
            cy.getDataCy('game-desktop-banner-bottom').should('be.visible');
        });

        it('should hide mobile banner grid on desktop', () => {
            cy.stub(useChessGameHook, 'default').returns(getMockChessGameState());

            cy.mount(withAllProviders(<Game />));
            cy.getDataCy('game-mobile-banners').should('not.be.visible');
        });

        it('should hide navbar on desktop', () => {
            cy.stub(useChessGameHook, 'default').returns(getMockChessGameState());

            cy.mount(withAllProviders(<Game />));
            cy.getDataCy('game-navbar').should('not.be.visible');
        });
    });

    describe('Mobile viewport', () => {
        beforeEach(() => {
            cy.viewport('iphone-6');
        });

        it('should render mobile banner grid', () => {
            cy.stub(useChessGameHook, 'default').returns(getMockChessGameState());

            cy.mount(withAllProviders(<Game />));
            cy.getDataCy('game-mobile-banners').should('be.visible');
        });

        it('should hide desktop banners on mobile', () => {
            cy.stub(useChessGameHook, 'default').returns(getMockChessGameState());

            cy.mount(withAllProviders(<Game />));
            cy.getDataCy('game-desktop-banner-top').should('not.be.visible');
            cy.getDataCy('game-desktop-banner-bottom').should('not.be.visible');
        });

        it('should show navbar on mobile', () => {
            cy.stub(useChessGameHook, 'default').returns(getMockChessGameState());

            cy.mount(withAllProviders(<Game />));
            cy.getDataCy('game-navbar').should('be.visible');
        });
    });
});
