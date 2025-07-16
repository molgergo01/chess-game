import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: [
        '**/lib/**/*.{js,ts,jsx,tsx}',
        '!**/config/**',
        '!**/clients/**',
        '!**/models/**',
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
        '@/(.*)': '<rootDir>/src/$1'
    },
    testEnvironment: 'jsdom'
};

export default config;
