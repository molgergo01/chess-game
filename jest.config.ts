import type { Config } from 'jest';

const config: Config = {
    verbose: true,
    projects: [
        '<rootDir>/apps/backend/auth',
        '<rootDir>/apps/backend/core',
        '<rootDir>/apps/backend/matchmaking',
        '<rootDir>/apps/frontend/'
        // '<rootDir>/apps/backend/'
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{js,ts}',
        '!**/node_modules/**',
        '!**/vendor/**',
        '!**/knexfile.js',
        '!**/migrations/**',
        '!**/config/**',
        '!**/jest.config.ts'
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    coverageProvider: 'v8'
};

export default config;
