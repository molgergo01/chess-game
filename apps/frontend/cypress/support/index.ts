// cypress/support/index.ts
import { mount } from 'cypress/react';

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
            /**
             * Custom command to inject a token required to access most pages.
             * @example cy.applyToken()
             */
            applyToken(): void;
            /**
             * Custom command to inject an invalid token which prevents access to most pages.
             * @example cy.applyInvalidToken()
             */
            applyInvalidToken(): void;
            /**
             * Custom command to mount a Component to the DOM.
             * @example cy.applyInvalidToken()
             */
            mount: typeof mount;
        }
    }
}
