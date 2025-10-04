import Banner from '@/components/game/banner/banner';
import { Color } from '@/lib/models/request/matchmaking';

describe('<Banner />', () => {
    const defaultProps = {
        playerColor: Color.WHITE,
        isOpponent: false,
        turnColor: Color.WHITE,
        timeLeft: 600000,
        playerName: 'TestPlayer',
        elo: 1500,
        avatarUrl: 'https://github.com/shadcn.png'
    };

    beforeEach(() => {
        // Set viewport to desktop size to ensure sm: classes are applied
        cy.viewport(1280, 720);
    });

    it('should render banner', () => {
        cy.mount(<Banner {...defaultProps} />);
        cy.getDataCy('banner').should('be.visible');
    });

    it('should render avatar', () => {
        cy.mount(<Banner {...defaultProps} />);
        cy.getDataCy('banner-avatar').should('be.visible');
    });

    it('should display avatar fallback when no image', () => {
        cy.mount(<Banner {...defaultProps} avatarUrl="" />);
        cy.getDataCy('banner-avatar').should('be.visible');
        cy.getDataCy('banner-avatar').should('contain.text', 'CN');
    });

    it('should display player name', () => {
        cy.mount(<Banner {...defaultProps} />);
        cy.getDataCy('banner-player-name').should('be.visible');
        cy.getDataCy('banner-player-name').should('have.text', 'TestPlayer');
    });

    it('should display elo rating', () => {
        cy.mount(<Banner {...defaultProps} />);
        cy.getDataCy('banner-elo').should('be.visible');
        cy.getDataCy('banner-elo').should('have.text', '1500');
    });

    it('should display player color WHITE', () => {
        cy.mount(<Banner {...defaultProps} playerColor={Color.WHITE} />);
        cy.getDataCy('banner-player-color').should('be.visible');
        cy.getDataCy('banner-player-color').should('have.text', 'white');
    });

    it('should display player color BLACK', () => {
        cy.mount(<Banner {...defaultProps} playerColor={Color.BLACK} />);
        cy.getDataCy('banner-player-color').should('be.visible');
        cy.getDataCy('banner-player-color').should('have.text', 'black');
    });

    it('should display formatted time on desktop', () => {
        cy.mount(<Banner {...defaultProps} timeLeft={330000} />);
        cy.getDataCy('banner-time-desktop').should('be.visible');
        cy.getDataCy('banner-time-mobile').should('not.be.visible');
        cy.getDataCy('banner-time-desktop').should('contain.text', '05:30');
    });

    it('should highlight background when it is player turn', () => {
        cy.mount(
            <Banner
                {...defaultProps}
                playerColor={Color.WHITE}
                turnColor={Color.WHITE}
            />
        );
        cy.getDataCy('banner').should('have.class', 'bg-foreground');
    });

    it('should not highlight when it is not player turn', () => {
        cy.mount(
            <Banner
                {...defaultProps}
                playerColor={Color.WHITE}
                turnColor={Color.BLACK}
            />
        );
        cy.getDataCy('banner').should('not.have.class', 'bg-foreground');
    });

    describe('Mobile viewport', () => {
        beforeEach(() => {
            cy.viewport('iphone-6');
        });

        it('should render banner on mobile', () => {
            cy.mount(<Banner {...defaultProps} />);
            cy.getDataCy('banner').should('be.visible');
        });

        it('should show time on mobile', () => {
            cy.mount(<Banner {...defaultProps} timeLeft={330000} />);
            cy.getDataCy('banner-time-mobile').should('be.visible');
            cy.getDataCy('banner-time-desktop').should('not.be.visible');
            cy.getDataCy('banner-time-mobile').should('contain.text', '05:30');
        });

        it('should render avatar on mobile', () => {
            cy.mount(<Banner {...defaultProps} />);
            cy.getDataCy('banner-avatar').should('be.visible');
        });

        it('should display player name on mobile', () => {
            cy.mount(<Banner {...defaultProps} />);
            cy.getDataCy('banner-player-name').should('be.visible');
            cy.getDataCy('banner-player-name').should(
                'have.text',
                'TestPlayer'
            );
        });

        it('should display elo on mobile', () => {
            cy.mount(<Banner {...defaultProps} />);
            cy.getDataCy('banner-elo').should('be.visible');
            cy.getDataCy('banner-elo').should('have.text', '1500');
        });

        it('should have flex-row layout for non-opponent on mobile', () => {
            cy.mount(<Banner {...defaultProps} isOpponent={false} />);
            cy.getDataCy('banner').should('have.class', 'flex-row');
            cy.getDataCy('banner').should('not.have.class', 'flex-row-reverse');
        });

        it('should have flex-row-reverse layout for opponent on mobile', () => {
            cy.mount(<Banner {...defaultProps} isOpponent={true} />);
            cy.getDataCy('banner').should('have.class', 'flex-row-reverse');
        });
    });
});
