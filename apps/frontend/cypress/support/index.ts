// cypress/support/index.ts
export {};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to select DOM element by data-cy attribute.
             * @example cy.dataCy('greeting')
             */
            getDataCy(value: string): Chainable;
            applyToken(): Chainable;
            applyInvalidToken(): Chainable;
        }
    }
}
