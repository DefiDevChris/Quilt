import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  eslintConfigPrettier,
  {
    rules: {
      'prefer-const': 'error',
      // Rules to help prevent code duplication
      'no-duplicate-imports': 'error',
      'max-lines-per-function': ['warn', 50],
      'max-params': ['warn', 4],
      complexity: ['warn', 10],
    },
  },
]);

export default eslintConfig;
