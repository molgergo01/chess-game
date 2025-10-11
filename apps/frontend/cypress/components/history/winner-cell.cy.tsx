import { WinnerCell } from '@/components/history/winner-cell';
import { Winner } from '@/lib/models/history/history';

describe('<WinnerCell />', () => {
    const whitePlayerId = 'white-player-123';
    const blackPlayerId = 'black-player-456';

    it('should show green "+" when user as white wins', () => {
        cy.mount(
            <WinnerCell
                whitePlayerId={whitePlayerId}
                blackPlayerId={blackPlayerId}
                userId={whitePlayerId}
                winner={Winner.WHITE}
            />
        );

        cy.getDataCy('winner-cell').should('be.visible').should('contain', '+').should('have.class', 'bg-green-500');
    });

    it('should show red "-" when user as white loses', () => {
        cy.mount(
            <WinnerCell
                whitePlayerId={whitePlayerId}
                blackPlayerId={blackPlayerId}
                userId={whitePlayerId}
                winner={Winner.BLACK}
            />
        );

        cy.getDataCy('winner-cell').should('be.visible').should('contain', '-').should('have.class', 'bg-red-500');
    });

    it('should show green "+" when user as black wins', () => {
        cy.mount(
            <WinnerCell
                whitePlayerId={whitePlayerId}
                blackPlayerId={blackPlayerId}
                userId={blackPlayerId}
                winner={Winner.BLACK}
            />
        );

        cy.getDataCy('winner-cell').should('be.visible').should('contain', '+').should('have.class', 'bg-green-500');
    });

    it('should show red "-" when user as black loses', () => {
        cy.mount(
            <WinnerCell
                whitePlayerId={whitePlayerId}
                blackPlayerId={blackPlayerId}
                userId={blackPlayerId}
                winner={Winner.WHITE}
            />
        );

        cy.getDataCy('winner-cell').should('be.visible').should('contain', '-').should('have.class', 'bg-red-500');
    });

    it('should show gray "=" when draw', () => {
        cy.mount(
            <WinnerCell
                whitePlayerId={whitePlayerId}
                blackPlayerId={blackPlayerId}
                userId={whitePlayerId}
                winner={Winner.DRAW}
            />
        );

        cy.getDataCy('winner-cell').should('be.visible').should('contain', '=').should('have.class', 'bg-gray-500');
    });
});
