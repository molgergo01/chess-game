import type { Config } from 'jest';

const config: Config = {
    verbose: true,
    projects: ['<rootDir>/apps/backend/', '<rootDir>/apps/frontend/'],
    collectCoverage: true,
    collectCoverageFrom: [
        '**/*.{js,ts,jsx,tsx}',
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
    }
};

export default config;
