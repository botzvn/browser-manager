// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // ─── 1. Global Ignores ────────────────────────────────────────────────────
  {
    ignores: ['dist', 'build', 'node_modules', 'coverage'],
  },

  // ─── 2. Base JS + TypeScript ──────────────────────────────────────────────
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ─── 3. React + Hooks + Import Sort ──────────────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // ── React ────────────────────────────────────────────────────────────
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Không cần import React (v17+)
      'react/prop-types': 'off', // TypeScript lo việc này
      'react/display-name': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ── TypeScript ───────────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // ── Import Sorting ────────────────────────────────────────────────────
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // 1. React và side-effect imports
            ['^react', '^\\u0000'],
            // 2. Third-party libraries
            ['^@?\\w'],
            // 3. Internal aliases (@/...)
            ['^@/'],
            // 4. Parent imports (../)
            ['^\\.\\.(?!/?$)', '^\\.\\.\\/? $'],
            // 5. Same-level imports (./)
            ['^\\.(?!/?$)', '^\\./?$'],
            // 6. Style imports
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // ── General Code Quality ──────────────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  // ─── 4. Tắt các rule ESLint xung đột với Prettier (PHẢI ở cuối) ──────────
  prettierConfig,
);
