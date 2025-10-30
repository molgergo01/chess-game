import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    verbose: true,
    testPathIgnorePatterns: ['<rootDir>/__tests__/fixtures/'],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{js,ts}',
        '!**/node_modules/**',
        '!**/vendor/**',
        '!**/knexfile.js',
        '!**/migrations/**',
        '!**/config/**',
        '!**/models/**',
        '!**/repositories/**',
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
    coverageProvider: 'v8',
    moduleNameMapper: {
        '^chess-game-backend-common/src/(.*)$': '<rootDir>/../common/src/$1',
        '^chess-game-backend-common/(.*)$': '<rootDir>/../common/src/$1'
    },
    maxWorkers: 1,
    forceExit: true
};

export default config;
