/** Lint the Next.js client, Bun server, and shared TypeScript contracts. */
import { defineConfig, globalIgnores } from 'eslint/config';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier/flat';

const clientRequire = createRequire(new URL('./client/package.json', import.meta.url));
const nextVitals = clientRequire('eslint-config-next/core-web-vitals');
const nextTs = clientRequire('eslint-config-next/typescript');

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/.next/**',
    '**/out/**',
    '**/build/**',
    '**/coverage/**',
    '**/.agents/**',
    '**/next-env.d.ts',
    'server/src/generated/**',
    'client/public/pdfjs/**'
  ]),
  {
    files: ['client/**/*.{js,mjs,ts,tsx}'],
    extends: [nextVitals, nextTs],
    settings: { next: { rootDir: fileURLToPath(new URL('./client/', import.meta.url)) } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['lucide*', '@tabler/icons*', 'react-icons', 'react-icons/*'],
              message: 'Use Hugeicons through @/components/icons for all interface icons.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['server/**/*.{js,mjs,ts}', 'shared/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.node, Bun: 'readonly' } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ]
    }
  },
  {
    files: ['*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node }
  },
  prettier,
  {
    files: ['server/**/*.{js,mjs,ts}'],
    rules: { curly: ['error', 'all'] }
  }
]);
