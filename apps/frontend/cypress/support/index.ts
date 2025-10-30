// cypress/support/index.ts
import { mount } from 'cypress/react';
import { CreateGameParams, CreateMoveParams, CreateUserParams } from './db-tasks';

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
            /**
             * Custom command to create a test user in the database.
             * @example cy.createUser({ userId: 'test-user-1', name: 'Test User', email: 'test@example.com', elo: 1500 })
             */
            createUser(params: CreateUserParams): Chainable;
            /**
             * Custom command to create a test game in the database.
             * @example cy.createGame({ gameId: 'test-game-1', whiteUserId: 'user1', blackUserId: 'user2', winner: 'w', startedAt: new Date() })
             */
            createGame(params: CreateGameParams): Chainable;
            /**
             * Custom command to create a test move in the database.
             * @example cy.createMove({ gameId: 'test-game-1', moveNumber: 1, playerColor: 'w', moveNotation: 'e4', positionFen: '...', whitePlayerTime: 600000, blackPlayerTime: 600000 })
             */
            createMove(params: CreateMoveParams): Chainable;
            /**
             * Custom command to cleanup all test data from the database.
             * @example cy.cleanupTestData()
             */
            cleanupTestData(): Chainable;
            createTestUserForToken(): Chainable;
        }
    }
}
