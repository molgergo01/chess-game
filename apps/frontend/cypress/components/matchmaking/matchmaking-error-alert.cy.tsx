import MatchmakingErrorAlert from '@/components/matchmaking/matchmaking-error-alert';

describe('<MatchmakingErrorAlert />', () => {
    const errorMessage = 'Failed to join matchmaking queue';

    it('should render alert with error message', () => {
        cy.mount(<MatchmakingErrorAlert message={errorMessage} />);

        cy.contains(errorMessage).should('be.visible');
    });

    it('should display "Matchmaking Error" title', () => {
        cy.mount(<MatchmakingErrorAlert message={errorMessage} />);

        cy.contains('Matchmaking Error').should('be.visible');
    });

    it('should render with destructive variant styling', () => {
        cy.mount(<MatchmakingErrorAlert message={errorMessage} />);

        cy.contains('Matchmaking Error').closest('[role="alert"]').should('have.class', 'border-destructive/50');
    });

    it('should accept and apply className prop', () => {
        const customClass = 'custom-test-class';

        cy.mount(<MatchmakingErrorAlert message={errorMessage} className={customClass} />);

        cy.get(`.${customClass}`).should('exist');
    });

    it('should accept and apply additional props', () => {
        cy.mount(<MatchmakingErrorAlert message={errorMessage} data-testid="custom-alert" />);

        cy.get('[data-testid="custom-alert"]').should('exist');
    });

    it('should render different error messages', () => {
        const firstMessage = 'Error message 1';
        const secondMessage = 'Error message 2';

        cy.mount(<MatchmakingErrorAlert message={firstMessage} />);
        cy.contains(firstMessage).should('be.visible');

        cy.mount(<MatchmakingErrorAlert message={secondMessage} />);
        cy.contains(secondMessage).should('be.visible');
    });
});
