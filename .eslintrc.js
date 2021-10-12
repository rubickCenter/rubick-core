module.exports = {
    parserOptions: {
        project: './tsconfig.json'
    },
    extends: [
        'standard-with-typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended'
    ],
    env: {
        browser: true,
        node: true
    },
    rules: {
        '@typescript-eslint/strict-boolean-expressions': 0,
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/return-await': 0,
    }
}
