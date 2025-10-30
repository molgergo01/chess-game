Cypress.Commands.add('getDataCy', (value) => {
    return cy.get(`[data-cy=${value}]`);
});
