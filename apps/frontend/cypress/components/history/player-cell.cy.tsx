import { PlayerCell } from '@/components/history/player-cell';

describe('<PlayerCell />', () => {
    it('should render with white and black player names and ELOs', () => {
        cy.mount(
            <PlayerCell
                whitePlayerName="Magnus Carlsen"
                whitePlayerElo={2850}
                blackPlayerName="Hikaru Nakamura"
                blackPlayerElo={2800}
            />
        );

        cy.getDataCy('player-cell').should('be.visible');
        cy.getDataCy('player-cell-white').should('contain', 'Magnus Carlsen').and('contain', '(2850)');
        cy.getDataCy('player-cell-black').should('contain', 'Hikaru Nakamura').and('contain', '(2800)');
    });
});
