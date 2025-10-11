import ErrorAlert from '@/components/ui/error-alert';

describe('<ErrorAlert />', () => {
    it('should render with title and message', () => {
        cy.mount(<ErrorAlert message="Test error message" title="Test Error" data-cy="error-alert" />);

        cy.getDataCy('error-alert').should('be.visible');
        cy.contains('Test Error').should('be.visible');
        cy.contains('Test error message').should('be.visible');
    });
});
