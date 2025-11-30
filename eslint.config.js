import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'apps/web/src/components/ui', 'apps/marketing/src/components/ui'],
  },
  // Base TypeScript config for all TS/TSX files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...(tsPlugin.configs?.recommended?.rules ?? {}),
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
      'no-console': 'warn',
      'no-undef': 'off', // TypeScript handles this
    },
  },
  // Node.js environments (API, DB, scripts)
  {
    files: ['apps/api/**/*.{ts,js}', 'packages/db/**/*.{ts,js}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Browser environments (Web, Marketing)
  {
    files: ['apps/web/**/*.{ts,tsx}', 'apps/marketing/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...(reactHooks.configs?.['recommended-latest']?.rules ?? {}),
      'react-refresh/only-export-components': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@pulse/db*'],
              message: 'Frontend must not import @pulse/db. Import @pulse/types instead.',
            },
          ],
        },
      ],
    },
  },
]
