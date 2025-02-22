import './commands';

Cypress.Commands.add('applyToken', () => {
    cy.visit('http://localhost:3000/login');
    cy.setCookie('token', Cypress.env('token'));
});

Cypress.Commands.add('applyInvalidToken', () => {
    cy.visit('http://localhost:3000/login');
    cy.setCookie('token', 'invalidToken');
});
