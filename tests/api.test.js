/**
 * @file tests/api.test.js
 * @description Suite de pruebas automatizadas nativa para H&M Servicios.
 * Valida utilidades de geolocalización, helpers y la conectividad de la base de datos (libSQL).
 */

const assert = require('assert');

// Cargar variables de entorno
require('dotenv').config();

// Asegurar una base de datos temporal para pruebas (archivo local, no la
// base de datos Turso de producción/desarrollo).
process.env.DB_PATH = './data/hm_servicios_test.db';
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;

const { db, initializeDatabase } = require('../server/config/database');
const { haversineDistance, findNearbyTechnicians } = require('../server/utils/geolocation');
const { formatCurrency, generateTransactionId } = require('../server/utils/helpers');

let passCount = 0;
let failCount = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(err);
    failCount++;
  }
}

async function main() {
  console.log('🧪 Iniciando pruebas de H&M Servicios...\n');

  // Inicializar la BD de pruebas
  await initializeDatabase();

  // 1. Pruebas de Geolocation
  await runTest('Geolocation: Cálculo de distancia Haversine', () => {
    // Distancia entre Plaza de Bolívar y Parque de la 93 en Bogotá (~9 km)
    const d = haversineDistance(4.5981, -74.0760, 4.6768, -74.0483);
    assert.ok(d > 8 && d < 10, `La distancia calculada fue ${d} km, esperado ~9 km`);
  });

  await runTest('Geolocation: Cálculo de distancia cero', () => {
    const d = haversineDistance(4.5981, -74.0760, 4.5981, -74.0760);
    assert.strictEqual(d, 0, 'La distancia a las mismas coordenadas debe ser 0');
  });

  // 2. Pruebas de Helpers
  await runTest('Helpers: formatCurrency', () => {
    const formatted = formatCurrency(150000);
    assert.ok(formatted.includes('150.000'), `El formato es incorrecto: ${formatted}`);
  });

  await runTest('Helpers: generateTransactionId', () => {
    const id1 = generateTransactionId();
    const id2 = generateTransactionId();
    assert.ok(id1.startsWith('HM-'), 'Debe empezar con HM-');
    assert.notStrictEqual(id1, id2, 'Los IDs generados secuencialmente deben ser distintos');
  });

  // 3. Pruebas de Base de Datos y Semilla
  await runTest('Database: Verificar existencia de servicios semilla', async () => {
    const services = await db.prepare('SELECT COUNT(*) as count FROM services').get();
    assert.ok(services.count >= 8, `Se esperaban mínimo 8 servicios semilla, encontrados: ${services.count}`);
  });

  await runTest('Database: Búsqueda de técnicos cercanos en la base de datos', async () => {
    // Coordenadas de prueba cerca de Usaquén (donde sembramos técnicos)
    const techs = await findNearbyTechnicians(db, 4.68, -74.04, 15);
    assert.ok(Array.isArray(techs), 'Debe retornar un array');
    assert.ok(techs.length > 0, 'Debe encontrar técnicos cercanos en Bogotá');
    assert.ok(techs[0].distance_km <= 15, 'El técnico más cercano debe estar dentro del radio de 15km');
  });

  console.log(`\n📊 Resumen de pruebas:`);
  console.log(`   Exitosas: ${passCount}`);
  console.log(`   Fallidas: ${failCount}`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Error fatal ejecutando las pruebas:', err);
  process.exit(1);
});
