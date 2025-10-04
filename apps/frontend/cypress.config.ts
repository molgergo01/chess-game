import { defineConfig } from 'cypress';
import dotenv from 'dotenv';

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
                }
            });

            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require('cypress-terminal-report/src/installLogsPrinter')(on);
        }
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
