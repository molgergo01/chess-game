import './commands';

const options = {
    collectTypes: ['cons:log', 'cons:warn', 'cons:error', 'cy:xhr']
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('cypress-terminal-report/src/installLogsCollector')(options);

Cypress.Commands.add('applyToken', () => {
    cy.visit('http://localhost:3000/login');
    cy.setCookie('token', Cypress.env('token'));
});

Cypress.Commands.add('applyInvalidToken', () => {
    cy.visit('http://localhost:3000/login');
    cy.setCookie('token', 'invalidToken');
});
