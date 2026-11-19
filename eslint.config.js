/**
 * @file eslint.config.js
 * @description Configuración básica de ESLint (flat config, ESLint 9+) para
 * H&M Servicios. No existía ninguna configuración de linter antes — esto
 * agrega reglas razonables para detectar errores reales (variables sin usar,
 * variables no declaradas, etc.) sin forzar un reformateo masivo del código
 * existente. Las reglas puramente de estilo (comillas, punto y coma, etc.)
 * se dejan a Prettier (ver .prettierrc.json) en vez de a ESLint, para que no
 * compitan entre sí — eslint-config-prettier apaga esas reglas de ESLint.
 */

const js = require('@eslint/js');
const globals = require('globals');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'data/**',
      'docs/**',
      'public/img/**',
      // HM-Sistema/ es un prototipo histórico no conectado a la app real
      // (ver HM-Sistema/README.md) — no vale la pena mantenerlo "limpio".
      'HM-Sistema/**',
    ],
  },

  js.configs.recommended,

  // Backend: Node.js / CommonJS (incluye este propio archivo de config,
  // que también es CommonJS y usa require/module.exports)
  {
    files: ['server/**/*.js', 'scripts/**/*.js', 'tests/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
    },
  },

  // Frontend: vanilla JS cargado por <script> en public/index.html (sin
  // bundler ni módulos ES) — cada archivo expone un objeto global propio
  // (auth, api, services, technicians, payments, dashboard) que los demás
  // archivos usan directamente, así que se declaran aquí como globals en
  // vez de que ESLint los marque como "no definidos".
  {
    files: ['public/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        auth: 'readonly',
        api: 'readonly',
        services: 'readonly',
        technicians: 'readonly',
        payments: 'readonly',
        dashboard: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
    },
  },

  // Cada uno de estos archivos es quien DEFINE su propio global (declarado
  // arriba como 'readonly' para que los demás archivos puedan usarlo), así
  // que ESLint ve su propio `const X = (() => {...})()` de nivel superior
  // como una "redeclaración" del global. Es un falso positivo inherente a
  // este patrón sin módulos/bundler, no un bug real: se apaga solo aquí.
  {
    files: ['public/js/auth.js'],
    rules: { 'no-redeclare': 'off' },
  },
  {
    files: ['public/js/api.js'],
    rules: { 'no-redeclare': 'off' },
  },
  {
    files: ['public/js/services.js'],
    rules: { 'no-redeclare': 'off' },
  },
  {
    files: ['public/js/technicians.js'],
    rules: { 'no-redeclare': 'off' },
  },
  {
    files: ['public/js/payments.js'],
    rules: { 'no-redeclare': 'off' },
  },
  {
    files: ['public/js/dashboard.js'],
    rules: { 'no-redeclare': 'off' },
  },

  // Apaga las reglas de estilo de ESLint que chocarían con Prettier.
  prettierConfig,
];
