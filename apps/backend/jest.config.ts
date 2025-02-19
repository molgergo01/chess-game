import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    coveragePathIgnorePatterns: ['server.ts', '**/config/**']
};

export default config;
