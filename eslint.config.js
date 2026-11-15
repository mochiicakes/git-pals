import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'preview/', 'node_modules/', 'src/assets.ts'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
