import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    verbose: true,
    collectCoverage: false,
    collectCoverageFrom: [
        'src/**/*.{js,ts}',
        '!**/node_modules/**',
        '!**/vendor/**',
        '!**/knexfile.js',
        '!**/migrations/**',
        '!**/config/**',
        '!**/models/**',
        '!**/jest.config.ts',
        '!**/server.ts',
        '!**/dist/**',
        '!**/coverage/**',
        '!**/*.d.ts'
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
