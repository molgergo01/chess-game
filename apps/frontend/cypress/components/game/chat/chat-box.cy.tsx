import ChatBox from '@/components/game/chat/chat-box';

describe('<ChatBox />', () => {
    beforeEach(() => {
        cy.mount(<ChatBox />);
    });

    it('should render chat container', () => {
        cy.get('.flex.flex-col.rounded-lg.border').should('exist');
    });

    it('should display initial messages', () => {
        cy.contains('Hello!').should('be.visible');
        cy.contains('Hi there!').should('be.visible');
        cy.contains('How are you?').should('be.visible');
    });

    it('should show "You" label for me messages', () => {
        cy.contains('You').should('be.visible');
    });

    it('should show "Opponent" label for other messages', () => {
        cy.contains('Opponent').should('be.visible');
    });

    it('should render textarea with placeholder', () => {
        cy.get('textarea')
            .should('be.visible')
            .should('have.attr', 'placeholder', 'Type your message...');
    });

    it('should display "me" messages on the right', () => {
        cy.contains('Hi there!')
            .parent()
            .parent()
            .should('have.class', 'justify-end');
    });

    it('should display "other" messages on the left', () => {
        cy.contains('Hello!')
            .parent()
            .parent()
            .should('have.class', 'justify-start');
    });
});
