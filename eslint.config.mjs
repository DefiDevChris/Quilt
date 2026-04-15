import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import eslintConfigPrettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Third-party libraries
    'public/**',
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
