import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import {
    cleanupTestData,
    CreateGameParams,
    CreateMoveParams,
    createTestGame,
    createTestMove,
    createTestUser,
    CreateUserParams
} from './cypress/support/db-tasks';

dotenv.config();

export default defineConfig({
    env: {
        token: process.env.TOKEN_NEVER_EXPIRES
    },

    e2e: {
        setupNodeEvents(on, _config) {
            on('task', {
                log(message) {
                    console.log(message);
                    return null;
                },
                async 'db:createUser'(params: CreateUserParams) {
                    await createTestUser(params);
                    return null;
                },
                async 'db:createGame'(params: CreateGameParams) {
                    await createTestGame(params);
                    return null;
                },
                async 'db:createMove'(params: CreateMoveParams) {
                    await createTestMove(params);
                    return null;
                },
                async 'db:cleanup'() {
                    await cleanupTestData();
                    return null;
                }
            });

            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require('cypress-terminal-report/src/installLogsPrinter')(on);
        },
        viewportWidth: 1920,
        viewportHeight: 1080
    },

    component: {
        devServer: {
            framework: 'next',
            bundler: 'webpack'
        },
        supportFile: 'cypress/support/component.tsx',
        viewportWidth: 1920,
        viewportHeight: 1080
    }
});
