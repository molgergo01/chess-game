//DUMMY TEST
describe('Main Page', () => {
    it('should contain Header', () => {
        cy.applyToken();
        cy.visit('http://localhost:3000/');
        cy.get('h1').should('contain', 'Welcome to Chess Game');
    });
});
