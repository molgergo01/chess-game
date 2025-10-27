import { LeaderboardPlayerCell } from '@/components/leaderboard/leaderboard-player-cell';

describe('<LeaderboardPlayerCell />', () => {
    it('should render with player name and avatar URL', () => {
        cy.mount(
            <LeaderboardPlayerCell playerName="Magnus Carlsen" playerAvatarUrl="https://example.com/avatar.jpg" />
        );

        cy.getDataCy('leaderboard-player-cell').should('be.visible');
        cy.getDataCy('leaderboard-white-avatar').should('be.visible');
        cy.contains('Magnus Carlsen').should('be.visible');
    });

    it('should render with player name and null avatar URL', () => {
        cy.mount(<LeaderboardPlayerCell playerName="Hikaru Nakamura" playerAvatarUrl={null} />);

        cy.getDataCy('leaderboard-player-cell').should('be.visible');
        cy.getDataCy('leaderboard-white-avatar').should('be.visible');
        cy.contains('Hikaru Nakamura').should('be.visible');
    });

    it('should display fallback avatar when no avatar URL is provided', () => {
        cy.mount(<LeaderboardPlayerCell playerName="Bobby Fischer" playerAvatarUrl={null} />);

        cy.getDataCy('leaderboard-white-avatar').should('be.visible');
        cy.getDataCy('leaderboard-white-avatar').should('contain', 'B');
    });
});
