import { CreateUserParams, CreateGameParams, CreateMoveParams } from './db-tasks';

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
