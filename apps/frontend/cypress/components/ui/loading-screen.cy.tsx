import LoadingScreen from '@/components/ui/loading-screen';

describe('<LoadingScreen />', () => {
    it('should render with spinner', () => {
        cy.mount(<LoadingScreen />);

        cy.getDataCy('loading-screen').should('be.visible');
        cy.getDataCy('spinner').should('be.visible');
    });
});
