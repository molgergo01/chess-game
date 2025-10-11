import ErrorAlertScreen from '@/components/ui/error-alert-screen';

describe('<ErrorAlertScreen />', () => {
    it('should render with error alert', () => {
        cy.mount(<ErrorAlertScreen errorMessage="Test error message" title="Test Error" dataCy="test-error-alert" />);

        cy.getDataCy('error-alert-screen').should('be.visible');
        cy.getDataCy('test-error-alert').should('be.visible');
    });
});
