module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:n/recommended',
  ],
  overrides: [
    {
      files: 'src/*.test.ts',
      rules: {
        'n/no-unpublished-import': 0,
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'n/no-process-exit': 0,
    '@typescript-eslint/no-explicit-any': 0,
    'n/shebang': [
      'error',
      {
        convertPath: {
          'src/*.ts': ['^src/(.+).ts$', 'dist/$1.js'],
        },
      },
    ],
  },
};
