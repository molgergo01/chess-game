import { ModeToggle } from '@/components/dark-mode-toggle';

describe('<DarkModeToggle />', () => {
    beforeEach(() => {
        cy.mount(<ModeToggle />);
    });

    it('should render, and buttons not in DOM', () => {
        cy.getDataCy('mode-toggle-dropdown').should('be.visible');
        cy.getDataCy('light-theme').should('not.exist');
        cy.getDataCy('dark-theme').should('not.exist');
        cy.getDataCy('system-theme').should('not.exist');
    });

    it('should render buttons after clicking', () => {
        cy.getDataCy('mode-toggle-dropdown').click();
        cy.getDataCy('light-theme').should('be.visible');
        cy.getDataCy('dark-theme').should('be.visible');
        cy.getDataCy('system-theme').should('be.visible');
    });
});
