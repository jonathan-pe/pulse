import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

// ESM flat ESLint config: register plugins and apply recommended rules for TS/TSX
export default [
  js.configs.recommended,
  // Global ignore patterns that should apply for the whole config
  {
    ignores: ['**/dist/**', 'apps/web/src/components/ui', 'apps/marketing/src/components/ui'],
  },
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
      // include recommended rule sets from the plugins where available
      ...(tsPlugin.configs?.recommended?.rules ?? {}),

      // repo-specific rules
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
    },
  },

  // API/DB specific
  {
    files: ['apps/api/**/*.{ts,tsx,js,jsx}', 'packages/db/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {},
  },

  // Client specific
  {
    files: ['apps/web/**/*.{ts,tsx,js,jsx}', 'apps/marketing/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...(reactHooks.configs?.['recommended-latest']?.rules ?? {}),
      ...(reactRefresh.configs?.vite?.rules ?? {}),

      'react-refresh/only-export-components': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@pulse/db*'],
              message: 'Frontend (and most libs) must not import @pulse/db. Import @pulse/types instead.',
            },
          ],
        },
      ],
    },
  },
]
