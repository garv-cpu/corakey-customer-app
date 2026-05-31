// ESLint flat config for the JavaScript-only React Native customer app.
const js = require("@eslint/js");

module.exports = [
  {
    ignores: ["node_modules/**", "android/**"]
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: "readonly",
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        Promise: "readonly",
        setTimeout: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "off"
    }
  }
];
