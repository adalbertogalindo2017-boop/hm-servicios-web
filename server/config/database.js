/**
 * @module server/config/database
 * @description Inicialización de la base de datos con @libsql/client.
 * Crea todas las tablas, índices y datos semilla al primer arranque.
 *
 * Antes este módulo usaba better-sqlite3 contra un archivo SQLite local.
 * Eso tenía dos problemas en Vercel: (1) el filesystem es de solo lectura
 * salvo /tmp, y /tmp no persiste entre invocaciones frías ni se comparte
 * entre instancias concurrentes, así que los datos se "perdían" todo el
 * tiempo; y (2) better-sqlite3 es un módulo nativo que hay que compilar
 * para la versión de Node del entorno de build, lo que rompía el deploy.
 *
 * Ahora usamos @libsql/client, que habla con una base de datos Turso
 * (libSQL) real y persistente cuando TURSO_DATABASE_URL/TURSO_AUTH_TOKEN
 * están configuradas, y cae a un archivo SQLite local (vía el mismo
 * cliente, en modo "file:") cuando no lo están — útil para desarrollo
 * local sin necesidad de una cuenta en Turso.
 *
 * Como @libsql/client es asíncrono (incluso en modo archivo local), este
 * módulo expone un objeto `db` que imita la forma de better-sqlite3
 * (`db.prepare(sql).get/.all/.run(...)`, `db.transaction(fn)`) pero cada
 * método devuelve una Promise. Todo el código que lo usa debe hacer
 * `await`. Las transacciones (`db.transaction(fn)`) usan una transacción
 * interactiva real de libSQL y AsyncLocalStorage para que cualquier
 * `db.prepare(...).run()` ejecutado dentro de `fn` se enrute
 * automáticamente a esa misma transacción — así el código de los
 * controladores no tuvo que cambiar de forma, solo agregarle `async`/`await`.
 */

const { createClient } = require('@libsql/client');
const { AsyncLocalStorage } = require('async_hooks');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

let clientConfig;
if (TURSO_URL) {
  clientConfig = { url: TURSO_URL, authToken: TURSO_AUTH_TOKEN, timeout: 5000 };
} else {
  if (process.env.VERCEL) {
    console.warn(
      '  ⚠️  TURSO_DATABASE_URL no está configurada. Usando SQLite en /tmp: ' +
      'los datos NO van a persistir entre invocaciones en Vercel. ' +
      'Configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en las variables de entorno del proyecto.'
    );
  }
  const DB_PATH = process.env.VERCEL
    ? '/tmp/hm_servicios.db'
    : path.resolve(process.env.DB_PATH || './data/hm_servicios.db');
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  clientConfig = { url: `file:${DB_PATH}`, timeout: 5000 };
}

const client = createClient(clientConfig);
const txStorage = new AsyncLocalStorage();

function getExecutor() {
  return txStorage.getStore() || client;
}

function rowToObject(row, columns) {
  const obj = {};
  columns.forEach((col, i) => {
    let v = row[i];
    if (typeof v === 'bigint') v = Number(v);
    obj[col] = v;
  });
  return obj;
}

// @libsql/client (a diferencia de better-sqlite3, que también lo rechaza,
// pero de forma mucho más opaca) lanza un error si se le pasa `undefined`
// como parámetro — solo acepta null/number/string/bigint/boolean/Buffer.
// Un campo opcional del body que el cliente no envió llega aquí como
// `undefined` (p. ej. `scheduled_date` en una solicitud de servicio), y la
// intención es siempre "no hay valor", es decir NULL en la columna. Se
// normaliza una sola vez aquí para que ningún controlador tenga que
// recordar hacer `?? null` en cada INSERT/UPDATE.
function normalizeArgs(args) {
  return args.map(a => (a === undefined ? null : a));
}

function makeStatement(sql) {
  return {
    async get(...args) {
      const exec = getExecutor();
      const result = await exec.execute({ sql, args: normalizeArgs(args) });
      return result.rows.length ? rowToObject(result.rows[0], result.columns) : undefined;
    },
    async all(...args) {
      const exec = getExecutor();
      const result = await exec.execute({ sql, args: normalizeArgs(args) });
      return result.rows.map(r => rowToObject(r, result.columns));
    },
    async run(...args) {
      const exec = getExecutor();
      const result = await exec.execute({ sql, args: normalizeArgs(args) });
      return {
        changes: result.rowsAffected,
        lastInsertRowid: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : undefined
      };
    }
  };
}

/** @type {{prepare: Function, exec: Function, transaction: Function}} */
const db = {
  prepare(sql) { return makeStatement(sql); },

  async exec(sql) {
    await client.executeMultiple(sql);
  },

  /**
   * Ejecuta `fn` dentro de una transacción interactiva real de libSQL.
   * Cualquier db.prepare(...).get/.all/.run invocado (directa o
   * indirectamente, a través de awaits) dentro de `fn` corre sobre esa
   * misma transacción gracias a AsyncLocalStorage. Si `fn` lanza un error,
   * se hace rollback de todo. Devuelve una función que, al llamarla,
   * ejecuta la transacción y devuelve lo que `fn` retorne — igual que
   * `db.transaction(fn)()` en better-sqlite3, pero asíncrono.
   */
  transaction(fn) {
    return async (...args) => {
      const MAX_RETRIES = 5;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        let tx;
        try {
          tx = await client.transaction('write');
        } catch (err) {
          if (err.code === 'SQLITE_BUSY' && attempt < MAX_RETRIES - 1) {
            await new Promise(r => setTimeout(r, 20 * (attempt + 1)));
            continue;
          }
          throw err;
        }
        try {
          const result = await txStorage.run(tx, () => fn(...args));
          await tx.commit();
          return result;
        } catch (err) {
          try { await tx.rollback(); } catch { /* ya pudo haber cerrado */ }
          if (err.code === 'SQLITE_BUSY' && attempt < MAX_RETRIES - 1) {
            await new Promise(r => setTimeout(r, 20 * (attempt + 1)));
            continue;
          }
          throw err;
        } finally {
          tx.close();
        }
      }
    };
  }
};

// ──────────────────────────────────────────────
// Creación de tablas
// ──────────────────────────────────────────────

/**
 * Inicializa todas las tablas de la base de datos.
 */
async function createTables() {
  await db.exec(`
    -- =============================================
    -- Tabla: users
    -- Almacena clientes, técnicos y administradores
    -- =============================================
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      phone         TEXT,
      address       TEXT,
      latitude      REAL,
      longitude     REAL,
      role          TEXT    NOT NULL DEFAULT 'client' CHECK(role IN ('client', 'technician', 'admin')),
      avatar        TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      is_active     INTEGER NOT NULL DEFAULT 1
    );

    -- =============================================
    -- Tabla: technician_profiles
    -- Perfil extendido para usuarios con rol técnico
    -- =============================================
    CREATE TABLE IF NOT EXISTS technician_profiles (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id             INTEGER NOT NULL UNIQUE,
      specialties         TEXT    DEFAULT '[]',          -- JSON array of specialty strings
      description         TEXT,
      coverage_radius_km  REAL    NOT NULL DEFAULT 10,
      rating_avg          REAL    NOT NULL DEFAULT 0,
      total_services      INTEGER NOT NULL DEFAULT 0,
      total_earnings      REAL    NOT NULL DEFAULT 0,
      is_available        INTEGER NOT NULL DEFAULT 1,
      id_document         TEXT,
      certification       TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- =============================================
    -- Tabla: services
    -- Catálogo de servicios ofrecidos
    -- =============================================
    CREATE TABLE IF NOT EXISTS services (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT    NOT NULL,
      category       TEXT    NOT NULL CHECK(category IN ('gasodomesticos', 'obra_civil')),
      description    TEXT,
      base_price     REAL    NOT NULL,
      estimated_time TEXT,
      icon           TEXT,
      is_active      INTEGER NOT NULL DEFAULT 1
    );

    -- =============================================
    -- Tabla: service_requests
    -- Solicitudes de servicio de clientes a técnicos
    -- =============================================
    CREATE TABLE IF NOT EXISTS service_requests (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id        INTEGER NOT NULL,
      technician_id    INTEGER,
      service_id       INTEGER NOT NULL,
      description      TEXT,
      status           TEXT    NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
      agreed_price     REAL,
      scheduled_date   TEXT,
      completed_date   TEXT,
      client_latitude  REAL,
      client_longitude REAL,
      client_address   TEXT,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id)    REFERENCES users(id),
      FOREIGN KEY (technician_id) REFERENCES users(id),
      FOREIGN KEY (service_id)   REFERENCES services(id)
    );

    -- =============================================
    -- Tabla: payments
    -- Registro de pagos por servicios completados
    -- =============================================
    CREATE TABLE IF NOT EXISTS payments (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      service_request_id  INTEGER NOT NULL,
      amount              REAL    NOT NULL,
      company_commission  REAL    NOT NULL,
      technician_payment  REAL    NOT NULL,
      payment_method      TEXT    NOT NULL CHECK(payment_method IN ('cash', 'transfer', 'card', 'nequi', 'daviplata')),
      payment_status      TEXT    NOT NULL DEFAULT 'pending'
                           CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')),
      transaction_id      TEXT    UNIQUE,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (service_request_id) REFERENCES service_requests(id)
    );

    -- =============================================
    -- Tabla: reviews
    -- Reseñas de clientes sobre servicios completados
    -- =============================================
    CREATE TABLE IF NOT EXISTS reviews (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      service_request_id INTEGER NOT NULL UNIQUE,
      client_id          INTEGER NOT NULL,
      technician_id      INTEGER NOT NULL,
      rating             INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment            TEXT,
      created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (service_request_id) REFERENCES service_requests(id),
      FOREIGN KEY (client_id)          REFERENCES users(id),
      FOREIGN KEY (technician_id)      REFERENCES users(id)
    );

    -- =============================================
    -- Tabla: technician_payouts
    -- Pagos acumulados a técnicos por períodos
    -- =============================================
    CREATE TABLE IF NOT EXISTS technician_payouts (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      technician_id INTEGER NOT NULL,
      amount        REAL    NOT NULL,
      status        TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processed', 'paid')),
      period        TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      paid_date     TEXT,
      FOREIGN KEY (technician_id) REFERENCES users(id)
    );

    -- =============================================
    -- Índices para consultas frecuentes
    -- =============================================
    CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
    CREATE INDEX IF NOT EXISTS idx_tp_user_id        ON technician_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_sr_client_id      ON service_requests(client_id);
    CREATE INDEX IF NOT EXISTS idx_sr_technician_id  ON service_requests(technician_id);
    CREATE INDEX IF NOT EXISTS idx_sr_status         ON service_requests(status);
    CREATE INDEX IF NOT EXISTS idx_payments_sr_id    ON payments(service_request_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_tech_id   ON reviews(technician_id);
    CREATE INDEX IF NOT EXISTS idx_payouts_tech_id   ON technician_payouts(technician_id);
  `);
}

// ──────────────────────────────────────────────
// Datos semilla
// ──────────────────────────────────────────────

/**
 * Inserta datos iniciales si la tabla de usuarios está vacía.
 * Incluye: admin, técnicos de ejemplo, clientes, servicios,
 * solicitudes de ejemplo y reseñas.
 */
async function seedData() {
  const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('  ℹ  Base de datos ya contiene datos, omitiendo seed.');
    return;
  }

  console.log('  🌱 Insertando datos semilla...');
  const SALT_ROUNDS = 10;

  // ─── Contraseñas pre-hasheadas ───
  const adminHash = bcrypt.hashSync('Admin123!', SALT_ROUNDS);
  const techHash  = bcrypt.hashSync('Tecnico123!', SALT_ROUNDS);
  const clientHash = bcrypt.hashSync('Cliente123!', SALT_ROUNDS);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, address, latitude, longitude, role, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTechProfile = db.prepare(`
    INSERT INTO technician_profiles (user_id, specialties, description, coverage_radius_km, rating_avg, total_services, total_earnings, is_available, id_document, certification)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertService = db.prepare(`
    INSERT INTO services (name, category, description, base_price, estimated_time, icon)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertRequest = db.prepare(`
    INSERT INTO service_requests (client_id, technician_id, service_id, description, status, agreed_price, scheduled_date, completed_date, client_latitude, client_longitude, client_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (service_request_id, client_id, technician_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO payments (service_request_id, amount, company_commission, technician_payment, payment_method, payment_status, transaction_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Execute all seeds inside a single transaction for atomicity
  const seed = db.transaction(async () => {
    // ─── 1. Admin user ───
    const admin = await insertUser.run(
      'Administrador H&M', 'admin@hmservicios.com', adminHash,
      '+573001234567', 'Cra 7 #45-23, Bogotá', 4.6486, -74.0628,
      'admin', null
    );

    // ─── 2. Technicians (5 in the Bogotá area) ───
    const t1 = await insertUser.run(
      'Carlos Martínez', 'carlos.martinez@email.com', techHash,
      '+573112345678', 'Cra 15 #80-25, Chapinero, Bogotá', 4.6585, -74.0579,
      'technician', null
    );
    await insertTechProfile.run(
      t1.lastInsertRowid,
      JSON.stringify(['Instalación de gas', 'Mantenimiento de calentadores', 'Detección de fugas']),
      'Técnico certificado en gasodomésticos con 8 años de experiencia. Especialista en calentadores y estufas.',
      15, 4.8, 127, 12700000, 1, 'CC-1023456789', 'CERT-GAS-2024-001'
    );

    const t2 = await insertUser.run(
      'María Rodríguez', 'maria.rodriguez@email.com', techHash,
      '+573123456789', 'Calle 100 #19-54, Usaquén, Bogotá', 4.6866, -74.0466,
      'technician', null
    );
    await insertTechProfile.run(
      t2.lastInsertRowid,
      JSON.stringify(['Obra civil', 'Remodelación', 'Enchapes', 'Pintura']),
      'Ingeniera civil con amplia experiencia en remodelaciones residenciales y acabados de alta calidad.',
      20, 4.9, 89, 15800000, 1, 'CC-1034567890', 'CERT-OC-2024-002'
    );

    const t3 = await insertUser.run(
      'Andrés López', 'andres.lopez@email.com', techHash,
      '+573134567890', 'Av. Suba #115-30, Suba, Bogotá', 4.7406, -74.0835,
      'technician', null
    );
    await insertTechProfile.run(
      t3.lastInsertRowid,
      JSON.stringify(['Instalación de gas', 'Redes de gas', 'Certificación de gas']),
      'Técnico profesional en instalaciones de gas natural domiciliario. Certificado por Gas Natural Fenosa.',
      12, 4.6, 65, 8450000, 1, 'CC-1045678901', 'CERT-GAS-2024-003'
    );

    const t4 = await insertUser.run(
      'Laura Gómez', 'laura.gomez@email.com', techHash,
      '+573145678901', 'Calle 63 #24-50, Barrios Unidos, Bogotá', 4.6612, -74.0739,
      'technician', null
    );
    await insertTechProfile.run(
      t4.lastInsertRowid,
      JSON.stringify(['Plomería', 'Obra civil', 'Remodelación de baños', 'Impermeabilización']),
      'Especialista en plomería y obra civil con enfoque en remodelaciones de baños y cocinas.',
      18, 4.7, 103, 11200000, 1, 'CC-1056789012', 'CERT-OC-2024-004'
    );

    const t5 = await insertUser.run(
      'Diego Hernández', 'diego.hernandez@email.com', techHash,
      '+573156789012', 'Cra 68 #13-45, Kennedy, Bogotá', 4.6188, -74.1185,
      'technician', null
    );
    await insertTechProfile.run(
      t5.lastInsertRowid,
      JSON.stringify(['Mantenimiento de calentadores', 'Instalación de estufas', 'Revisión de gas']),
      'Técnico integral en gasodomésticos. Servicio a domicilio en el sur de Bogotá.',
      25, 4.5, 42, 4800000, 1, 'CC-1067890123', 'CERT-GAS-2024-005'
    );

    // ─── 3. Clients (3) ───
    const c1 = await insertUser.run(
      'Ana Morales', 'ana.morales@email.com', clientHash,
      '+573167890123', 'Cra 11 #93-20, Chicó, Bogotá', 4.6780, -74.0479,
      'client', null
    );
    const c2 = await insertUser.run(
      'Pedro Sánchez', 'pedro.sanchez@email.com', clientHash,
      '+573178901234', 'Calle 53 #14-30, Teusaquillo, Bogotá', 4.6378, -74.0692,
      'client', null
    );
    const c3 = await insertUser.run(
      'Sofía Castro', 'sofia.castro@email.com', clientHash,
      '+573189012345', 'Av. Boyacá #64-25, Engativá, Bogotá', 4.6698, -74.1062,
      'client', null
    );

    // ─── 4. Services (4 gasodomésticos + 4 obra civil) ───
    const s1 = await insertService.run(
      'Instalación de Calentador', 'gasodomesticos',
      'Instalación completa de calentador de agua a gas, incluye pruebas de funcionamiento y seguridad.',
      180000, '2-3 horas', 'flame'
    );
    const s2 = await insertService.run(
      'Mantenimiento de Estufa', 'gasodomesticos',
      'Limpieza, calibración y revisión de seguridad de estufas a gas. Incluye cambio de empaques.',
      85000, '1-2 horas', 'tool'
    );
    const s3 = await insertService.run(
      'Detección de Fugas de Gas', 'gasodomesticos',
      'Inspección completa de redes de gas domiciliario con equipos especializados para detección de fugas.',
      120000, '1 hora', 'alert-triangle'
    );
    const s4 = await insertService.run(
      'Certificación de Red de Gas', 'gasodomesticos',
      'Revisión técnica reglamentaria y certificación de la red de gas natural según normativa vigente.',
      250000, '3-4 horas', 'check-circle'
    );
    const s5 = await insertService.run(
      'Remodelación de Baño', 'obra_civil',
      'Remodelación integral de baño: enchapes, griferías, sanitarios y acabados. Mano de obra incluida.',
      2500000, '5-7 días', 'home'
    );
    const s6 = await insertService.run(
      'Pintura Interior', 'obra_civil',
      'Servicio de pintura profesional para interiores, incluye preparación de superficies y dos manos de pintura.',
      350000, '2-3 días', 'paint-bucket'
    );
    const s7 = await insertService.run(
      'Impermeabilización', 'obra_civil',
      'Impermeabilización de terrazas, cubiertas y muros con materiales de alta calidad y garantía.',
      450000, '2-3 días', 'droplet'
    );
    const s8 = await insertService.run(
      'Reparación de Pisos y Enchapes', 'obra_civil',
      'Instalación y reparación de pisos en cerámica, porcelanato o madera. Incluye nivelación.',
      600000, '3-5 días', 'grid'
    );

    // ─── 5. Sample service requests ───
    // Completed request with payment and review
    const sr1 = await insertRequest.run(
      c1.lastInsertRowid, t1.lastInsertRowid, s1.lastInsertRowid,
      'Necesito instalar un calentador nuevo en el baño principal.',
      'completed', 190000, '2026-05-20', '2026-05-20',
      4.6780, -74.0479, 'Cra 11 #93-20, Chicó, Bogotá'
    );

    await insertPayment.run(
      sr1.lastInsertRowid, 190000, 28500, 161500, 'nequi', 'completed', 'HM-TXN-SEED-001'
    );

    await insertReview.run(
      sr1.lastInsertRowid, c1.lastInsertRowid, t1.lastInsertRowid,
      5, 'Excelente servicio, muy profesional y puntual. Instalación perfecta.'
    );

    // Another completed request
    const sr2 = await insertRequest.run(
      c2.lastInsertRowid, t2.lastInsertRowid, s5.lastInsertRowid,
      'Remodelación completa del baño de visitas.',
      'completed', 2800000, '2026-05-15', '2026-05-22',
      4.6378, -74.0692, 'Calle 53 #14-30, Teusaquillo, Bogotá'
    );

    await insertPayment.run(
      sr2.lastInsertRowid, 2800000, 420000, 2380000, 'transfer', 'completed', 'HM-TXN-SEED-002'
    );

    await insertReview.run(
      sr2.lastInsertRowid, c2.lastInsertRowid, t2.lastInsertRowid,
      5, 'Trabajo increíble, el baño quedó como nuevo. Muy recomendada.'
    );

    // In-progress request
    await insertRequest.run(
      c3.lastInsertRowid, t4.lastInsertRowid, s7.lastInsertRowid,
      'Impermeabilizar la terraza del apartamento, hay filtraciones.',
      'in_progress', 500000, '2026-05-26', null,
      4.6698, -74.1062, 'Av. Boyacá #64-25, Engativá, Bogotá'
    );

    // Pending request
    await insertRequest.run(
      c1.lastInsertRowid, t3.lastInsertRowid, s4.lastInsertRowid,
      'Necesito certificar la red de gas del apartamento nuevo.',
      'pending', null, '2026-05-30', null,
      4.6780, -74.0479, 'Cra 11 #93-20, Chicó, Bogotá'
    );

    // Accepted request
    await insertRequest.run(
      c2.lastInsertRowid, t5.lastInsertRowid, s2.lastInsertRowid,
      'La estufa tiene baja presión en dos quemadores.',
      'accepted', 95000, '2026-05-28', null,
      4.6378, -74.0692, 'Calle 53 #14-30, Teusaquillo, Bogotá'
    );
  });

  await seed(); // Execute the transaction
  console.log('  ✅ Datos semilla insertados correctamente.');
}

// ──────────────────────────────────────────────
// Inicialización
// ──────────────────────────────────────────────

/**
 * Ejecuta la creación de tablas y la carga de datos semilla.
 */
async function initializeDatabase() {
  console.log('📦 Inicializando base de datos...');
  console.log(`   Backend: ${TURSO_URL ? `Turso (${TURSO_URL})` : clientConfig.url}`);
  await createTables();
  await seedData();
  console.log('📦 Base de datos lista.\n');
}

module.exports = { db, initializeDatabase };
