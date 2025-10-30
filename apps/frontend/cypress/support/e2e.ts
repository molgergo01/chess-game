import './commands';
import { CreateGameParams, CreateMoveParams, CreateUserParams } from './db-tasks';

const options = {
    collectTypes: ['cons:log', 'cons:warn', 'cons:error', 'cy:xhr']
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('cypress-terminal-report/src/installLogsCollector')(options);

Cypress.Commands.add('createTestUserForToken', () => {
    return cy.task('db:createUser', {
        userId: 'test-user-authenticated',
        name: 'Test User',
        email: 'test@user.com',
        elo: 1500
    });
});

Cypress.Commands.add('applyToken', () => {
    cy.visit('http://localhost:3000/login');
    cy.setCookie('token', Cypress.env('token'));
});

Cypress.Commands.add('applyInvalidToken', () => {
    cy.visit('http://localhost:3000/login');
    cy.setCookie('token', 'invalidToken');
});

Cypress.Commands.add('getDataCy', (value) => {
    return cy.get(`[data-cy=${value}]`);
});

Cypress.Commands.add('createUser', (params: CreateUserParams) => {
    return cy.task('db:createUser', params);
});

Cypress.Commands.add('createGame', (params: CreateGameParams) => {
    return cy.task('db:createGame', params);
});

Cypress.Commands.add('createMove', (params: CreateMoveParams) => {
    return cy.task('db:createMove', params);
});

Cypress.Commands.add('cleanupTestData', () => {
    return cy.task('db:cleanup');
});
