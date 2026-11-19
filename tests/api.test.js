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
const { validationResult } = require('express-validator');
const { registerRules, loginRules, forgotPasswordRules } = require('../server/middleware/validation');
const paymentsController = require('../server/controllers/payments.controller');

/**
 * Corre una cadena de reglas de express-validator (p.ej. registerRules)
 * contra un body falso, sin levantar un servidor HTTP real, y devuelve el
 * resultado de validationResult — así se prueba exactamente la misma
 * lógica que corre en producción sin necesitar supertest ni un puerto.
 * El último elemento de cada arreglo de reglas es handleValidationErrors
 * (una función normal, no una cadena de validación), que se salta aquí
 * porque no tiene .run() y el resultado se evalúa directamente.
 */
async function runValidationRules(rules, body) {
  const req = { body };
  for (const rule of rules) {
    if (typeof rule.run === 'function') {
      await rule.run(req);
    }
  }
  return { result: validationResult(req), req };
}

// Pequeño "res" falso para probar controladores Express directamente,
// capturando el código de estado y el cuerpo de la respuesta en vez de
// escribirlos a una conexión HTTP real.
function fakeRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { res.statusCode = code; return res; },
    json(payload) { res.body = payload; return res; },
  };
  return res;
}

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

  // 4. Validación de registro/login/recuperación (server/middleware/validation.js)
  // Cubre los dos bugs reales de esta sesión: registerRules/loginRules no
  // estaban conectados a las rutas (cualquier contraseña pasaba), y al
  // conectarlos se reintrodujo el bug del prefijo "mailto:" en el login.
  await runTest('Validación: registro rechaza contraseña débil', async () => {
    const { result } = await runValidationRules(registerRules, {
      name: 'Test', email: 'test@example.com', password: 'abc123', role: 'client'
    });
    assert.strictEqual(result.isEmpty(), false, 'Una contraseña de 6 caracteres sin mayúscula/símbolo debe ser rechazada');
    const fields = result.array().map(e => e.path);
    assert.ok(fields.includes('password'), 'El error debe señalar el campo password');
  });

  await runTest('Validación: registro acepta contraseña fuerte', async () => {
    const { result } = await runValidationRules(registerRules, {
      name: 'Test', email: 'test2@example.com', password: 'Abcdef12!', role: 'client'
    });
    assert.strictEqual(result.isEmpty(), true, `No debería haber errores: ${JSON.stringify(result.array())}`);
  });

  await runTest('Validación: login con prefijo "mailto:" sigue siendo válido', async () => {
    // Regresión: al conectar loginRules, isEmail() corría ANTES de que el
    // controlador quitara el prefijo "mailto:" que algunos navegadores
    // anteponen al autocompletar, rechazando como "no válido" un correo
    // real. validation.js ahora quita ese prefijo con un customSanitizer
    // antes de isEmail().
    const { result, req } = await runValidationRules(loginRules, {
      email: 'mailto:admin@hmservicios.com', password: 'Admin123!'
    });
    assert.strictEqual(result.isEmpty(), true, `El prefijo mailto: no debería invalidar el correo: ${JSON.stringify(result.array())}`);
    assert.strictEqual(req.body.email, 'admin@hmservicios.com', 'El sanitizador debe quitar el prefijo mailto: del body');
  });

  await runTest('Validación: recuperación de contraseña rechaza nueva contraseña débil', async () => {
    const { result } = await runValidationRules(forgotPasswordRules, {
      email: 'admin@hmservicios.com', phone: '3001234567', newPassword: '12345678'
    });
    assert.strictEqual(result.isEmpty(), false, 'Una nueva contraseña sin mayúscula/símbolo debe ser rechazada');
  });

  // 5. Seguridad: el detalle de un pago no debe filtrarse a otros usuarios
  // (antes getPaymentDetail no verificaba dueño — ver payments.controller.js).
  await runTest('Seguridad: getPaymentDetail bloquea a quien no es dueño del pago', async () => {
    const client = await db.prepare("SELECT id FROM users WHERE role = 'client' LIMIT 1").get();
    const otherClient = await db.prepare("SELECT id FROM users WHERE role = 'client' AND id != ?").get(client.id);
    const service = await db.prepare('SELECT id FROM services LIMIT 1').get();
    assert.ok(client && service, 'Se necesita al menos un cliente y un servicio sembrados para esta prueba');

    const reqInsert = await db.prepare(`
      INSERT INTO service_requests (client_id, service_id, status, client_address)
      VALUES (?, ?, 'completed', 'Dirección de prueba')
    `).run(client.id, service.id);
    const requestId = reqInsert.lastInsertRowid;

    const payInsert = await db.prepare(`
      INSERT INTO payments (service_request_id, amount, company_commission, technician_payment, payment_method, payment_status, transaction_id)
      VALUES (?, 100000, 15000, 85000, 'cash', 'completed', ?)
    `).run(requestId, generateTransactionId());
    const paymentId = payInsert.lastInsertRowid;

    // El dueño (o un admin) sí debe poder verlo.
    const resOwner = fakeRes();
    await paymentsController.getPaymentDetail({ params: { id: paymentId }, user: { id: client.id, role: 'client' } }, resOwner);
    assert.strictEqual(resOwner.statusCode, 200, 'El dueño del pago debería poder verlo');
    assert.ok(resOwner.body && resOwner.body.success, 'La respuesta al dueño debe ser exitosa');

    // Otro cliente cualquiera NO debe poder verlo (este es el bug que se corrigió).
    if (otherClient) {
      const resOther = fakeRes();
      await paymentsController.getPaymentDetail({ params: { id: paymentId }, user: { id: otherClient.id, role: 'client' } }, resOther);
      assert.strictEqual(resOther.statusCode, 403, `Un cliente ajeno al pago no debería poder verlo (obtuvo ${resOther.statusCode})`);
    }
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
