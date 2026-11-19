/**
 * @file scripts/copy-assets.js
 * @description Se corre con `npm run setup` antes de `npm run dev`/`npm start`.
 *
 * Antes este script copiaba una imagen (landing-page-mockup.png) desde una
 * ruta absoluta de Windows en el computador original del proyecto
 * ("C:\Users\usuario\.gemini\..."), así que solo funcionaba ahí — en
 * cualquier otro computador (otro sistema operativo, otro usuario) fallaba
 * siempre con ENOENT.
 *
 * Esa imagen ya está versionada en el repositorio (public/img/ y
 * docs/assets/), así que ya no hay nada que copiar desde fuera: este script
 * ahora solo verifica que esos archivos existan y avisa claramente si
 * faltan, en vez de depender de una ruta que solo existe en un computador
 * específico.
 */

const fs = require('fs');
const path = require('path');

const ASSET_NAME = 'landing-page-mockup.png';

const dests = [
  path.join(__dirname, '../public/img', ASSET_NAME),
  path.join(__dirname, '../docs/assets', ASSET_NAME),
];

fs.mkdirSync(path.join(__dirname, '../public/img'), { recursive: true });
fs.mkdirSync(path.join(__dirname, '../docs/assets'), { recursive: true });

let allPresent = true;

dests.forEach((dest) => {
  if (fs.existsSync(dest)) {
    console.log(`✅ Ya existe: ${path.relative(path.join(__dirname, '..'), dest)}`);
  } else {
    allPresent = false;
    console.warn(
      `⚠️  Falta: ${path.relative(path.join(__dirname, '..'), dest)} — ` +
      `agrega manualmente la imagen "${ASSET_NAME}" en esa ruta si la necesitas.`
    );
  }
});

if (allPresent) {
  console.log('Setup de assets completo (nada que copiar, ya están en el repositorio).');
}
