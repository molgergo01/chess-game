import CopyableLink from '@/components/ui/copyable-link';

describe('<CopyableLink />', () => {
    const testLink = 'https://example.com/invite/abc123';

    beforeEach(() => {
        cy.stub(navigator.clipboard, 'writeText').resolves();
    });

    it('should render with link text and copy button', () => {
        cy.mount(<CopyableLink link={testLink} />);

        cy.getDataCy('matchmaking-invite-link-container').should('be.visible');
        cy.getDataCy('matchmaking-invite-link').should('be.visible').should('have.value', testLink);
        cy.getDataCy('matchmaking-copy-link-button').should('be.visible').should('contain.text', 'Copy');
    });

    it('should display "Copy" text initially', () => {
        cy.mount(<CopyableLink link={testLink} />);

        cy.getDataCy('matchmaking-copy-link-button').should('contain.text', 'Copy');
    });

    it('should copy link to clipboard when copy button is clicked', () => {
        cy.mount(<CopyableLink link={testLink} />);

        cy.getDataCy('matchmaking-copy-link-button').click();

        cy.wrap(navigator.clipboard.writeText).should('have.been.calledWith', testLink);
    });

    it('should show "Copied!" feedback after clicking copy button', () => {
        cy.mount(<CopyableLink link={testLink} />);

        cy.getDataCy('matchmaking-copy-link-button').click();

        cy.getDataCy('matchmaking-copy-link-button').should('contain.text', 'Copied!');
    });

    it('should reset to "Copy" after 2 seconds', () => {
        cy.mount(<CopyableLink link={testLink} />);

        cy.getDataCy('matchmaking-copy-link-button').click();
        cy.getDataCy('matchmaking-copy-link-button').should('contain.text', 'Copied!');

        cy.wait(2000);

        cy.getDataCy('matchmaking-copy-link-button').should('contain.text', 'Copy');
    });

    it('should auto-copy link when autoCopy prop is true', () => {
        cy.mount(<CopyableLink link={testLink} autoCopy={true} />);

        cy.wrap(navigator.clipboard.writeText).should('have.been.calledWith', testLink);
    });

    it('should display "Copied!" initially when autoCopy is true', () => {
        cy.mount(<CopyableLink link={testLink} autoCopy={true} />);

        cy.getDataCy('matchmaking-copy-link-button').should('contain.text', 'Copied!');
    });

    it('should not auto-copy when autoCopy prop is false', () => {
        cy.mount(<CopyableLink link={testLink} autoCopy={false} />);

        cy.wrap(navigator.clipboard.writeText).should('not.have.been.called');
        cy.getDataCy('matchmaking-copy-link-button').should('contain.text', 'Copy');
    });

    it('should allow multiple copy actions', () => {
        cy.mount(<CopyableLink link={testLink} />);

        cy.getDataCy('matchmaking-copy-link-button').click();
        cy.getDataCy('matchmaking-copy-link-button').should('contain.text', 'Copied!');

        cy.wait(2000);

        cy.getDataCy('matchmaking-copy-link-button').click();
        cy.getDataCy('matchmaking-copy-link-button').should('contain.text', 'Copied!');

        cy.wrap(navigator.clipboard.writeText).should('have.been.calledTwice');
    });

    it('should render input as readonly', () => {
        cy.mount(<CopyableLink link={testLink} />);

        cy.getDataCy('matchmaking-invite-link').should('have.attr', 'readonly');
    });
});
