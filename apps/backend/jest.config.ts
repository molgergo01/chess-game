import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    coveragePathIgnorePatterns: ['server.ts']
};

export default config;
