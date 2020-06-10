### ESLint plugin Svelte Preprocessor

## Purpose

It's a preprocessor to use with [`eslint-plugin-svelte3`](https://github.com/sveltejs/eslint-plugin-svelte3) to produce AST valid to the original code.

For now only TypeScript is supported but the idea is to add Coffeescript and Pug support, like the [`svelte-preprocess`](https://github.com/sveltejs/svelte-preprocess) package.

Many thanks to [Conduitry](https://github.com/Conduitry) and her/his initial work on her/his [fork](https://github.com/Conduitry/eslint-plugin-svelte3).

## Install

```
pnpm i -D eslint-svelte3-preprocess
```

## Usage

After following the docs of [`eslint-plugin-svelte3`](https://github.com/sveltejs/eslint-plugin-svelte3) to configure your `eslintrc.js` file, you will need to add some props required by [@typescript-eslint/parser](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/parser) and finally import your `svelte.config` file (if you would like to use the same configuration) and call the `elint-plugin-svelte3-preprocess` passing your preprocess as a parameter.

This is a example that works!

```js
const eslintSveltePreprocess = require('eslint-svelte3-preprocess');
const svelteConfig = require('./svelte.config');

module.exports = {
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
    },
    parser: "@typescript-eslint/parser",
    env: {
        es6: true,
        browser: true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    plugins: [
        'svelte3',
        "@typescript-eslint",
    ],
    overrides: [
        {
            files: ['*.svelte'],
            processor: 'svelte3/svelte3',
        }
    ],
    settings: {
        'svelte3/preprocess': eslintSveltePreprocess(svelteConfig.preprocess),
	},
};

```

## Editor support

I only tested it on Visual Studio Code, but I guess it should be similar for other editors. If you find the way to solve it, I would appreciate your collaboration to improve this documentation.

### Visual Studio Code

Having [Svelte Beta](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) and [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extensions, you need to add this to your configuration.

```json
{
    "eslint.validate": [
    "svelte"
  ]
}
```
