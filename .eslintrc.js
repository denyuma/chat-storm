module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'node': true,
    'jquery': true
  },
  'extends': 'eslint:recommended',
  'rules': {
    'indent': [
      'error',
      2,
      { 'SwitchCase': 1 }
    ],
    'linebreak-style': [
      'error',
      'windows'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    'no-unused-vars': [
      'error',
      {
        'vars': 'all',
        'args': 'none'
      }
    ],
    'no-console': [
      'off'
    ],
    'consistent-return': [
      'error'
    ],
  },
  "parserOptions": {
    "sourceType": "module"
  }
};