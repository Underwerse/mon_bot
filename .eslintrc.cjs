module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'google',
    'plugin:prettier/recommended',
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'prettier'],
  rules: {
    'linebreak-style': ['warn', 'unix'],
    indent: ['warn', 2],
    'no-var': 'error',
    semi: 'off',
    'no-multi-spaces': 'off',
    'no-trailing-spaces': 'off',
    'space-in-parens': 'error',
    'no-multiple-empty-lines': 'off',
    'prefer-const': 'warn',
    'no-use-before-define': 'error',
    'no-unused-vars': 'warn',
    'require-jsdoc': 'off',
    'no-invalid-this': 'off',
    'new-cap': 'off',
    'disable-camelcase': 'on',
  },
}
