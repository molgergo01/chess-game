import ChessboardWithBanners from '@/components/ui/chessboard-with-banners';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';

describe('<ChessboardWithBanners />', () => {
    const whitePlayerInfo = {
        name: 'White Player',
        elo: 1500,
        avatarUrl: 'https://example.com/white.png'
    };

    const blackPlayerInfo = {
        name: 'Black Player',
        elo: 1600,
        avatarUrl: 'https://example.com/black.png'
    };

    it('should render with all banners and chessboard', () => {
        cy.mount(
            <ChessboardWithBanners
                boardPosition=""
                boardOrientation={MatchmakingColor.WHITE}
                turnColor={MatchmakingColor.WHITE}
                whitePlayerInfo={whitePlayerInfo}
                blackPlayerInfo={blackPlayerInfo}
                whiteTimeLeft={300000}
                blackTimeLeft={300000}
            />
        );

        cy.getDataCy('game-mobile-banners').should('not.be.visible');
        cy.getDataCy('game-desktop-banner-top').should('be.visible');
        cy.getDataCy('game-desktop-banner-bottom').should('be.visible');
        cy.getDataCy('game-chessboard-container').should('be.visible');
    });

    it('should render mobile banners on mobile viewport', () => {
        cy.viewport(375, 667);

        cy.mount(
            <ChessboardWithBanners
                boardPosition=""
                boardOrientation={MatchmakingColor.WHITE}
                turnColor={MatchmakingColor.WHITE}
                whitePlayerInfo={whitePlayerInfo}
                blackPlayerInfo={blackPlayerInfo}
                whiteTimeLeft={300000}
                blackTimeLeft={300000}
            />
        );

        cy.getDataCy('game-mobile-banners').should('be.visible');
        cy.getDataCy('game-desktop-banner-top').should('not.be.visible');
        cy.getDataCy('game-desktop-banner-bottom').should('not.be.visible');
        cy.getDataCy('game-chessboard-container').should('be.visible');
    });
});
