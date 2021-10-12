module.exports = {
  extends: 'standard-with-typescript',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 0,
    // https://github.com/typescript-eslint/typescript-eslint/blob/ef88a696a157f617d38ce6d49207a4a4a089a19b/packages/eslint-plugin/docs/rules/naming-convention.md#enforce-that-interface-names-do-not-begin-with-an-i
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase']
      }
    ],
    '@typescript-eslint/prefer-nullish-coalescing': 0,
    '@typescript-eslint/return-await': 0,
    '@typescript-eslint/no-floating-promises': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/semi': ["error", "always"],
    'comma-dangle': ["error", {
      "objects": "always"
    }],
  }
}
