import { defineConfig } from 'cypress';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    env: {
        token: process.env.TOKEN_NEVER_EXPIRES
    },
    e2e: {
        //setupNodeEvents(on, _config) {}
    }
});
