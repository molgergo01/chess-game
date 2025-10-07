import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    {
        ignores: ['**/node_modules', '**/dist', '**/build', '**/.next', '**/.yarn']
    },
    ...compat
        .extends(
            'next/core-web-vitals',
            'next/typescript',
            'plugin:@typescript-eslint/recommended',
            'plugin:@next/next/recommended'
        )
        .map((config) => ({
            ...config,
            files: ['apps/frontend/**/*.{js,ts,jsx,tsx}']
        })),
    {
        files: ['apps/frontend/**/*.{js,ts,jsx,tsx}'],

        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_'
                }
            ],

            'react/display-name': 'off',
            'react/no-unescaped-entities': 'off',
            '@next/next/no-html-link-for-pages': ['error', 'apps/frontend/src/app']
        }
    },
    ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended').map((config) => ({
        ...config,
        files: ['apps/backend/**/*.{js,ts}']
    })),
    {
        files: ['apps/backend/**/*.{js,ts}'],

        languageOptions: {
            globals: {
                ...globals.node
            }
        },

        rules: {
            '@typescript-eslint/no-var-requires': 'off',
            'no-console': 'off'
        }
    }
];
