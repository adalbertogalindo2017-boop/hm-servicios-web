/**
 * @module server/config/database
 * @description Inicialización de la base de datos SQLite con better-sqlite3.
 * Crea todas las tablas, índices y datos semilla al primer arranque.
 * Usa modo WAL para mejor rendimiento en lecturas concurrentes.
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

/**
 * Ruta absoluta al archivo de la base de datos.
 * Se crea el directorio contenedor si no existe.
 */
// En Vercel (funciones serverless) el sistema de archivos es de solo lectura
// salvo /tmp, por lo que ahí se guarda la base de datos cuando corre en ese
// entorno. Ten en cuenta que /tmp no persiste entre invocaciones frías, así
// que en producción real conviene migrar a una base de datos gestionada
// (por ejemplo Turso/libSQL o Postgres) en vez de SQLite local.
const DB_PATH = process.env.VERCEL
  ? '/tmp/hm_servicios.db'
  : path.resolve(process.env.DB_PATH || './data/hm_servicios.db');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

/** @type {import('better-sqlite3').Database} */
const db = new Database(DB_PATH);

// ──────────────────────────────────────────────
// Pragmas de rendimiento
// ──────────────────────────────────────────────
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// ──────────────────────────────────────────────
// Creación de tablas
// ──────────────────────────────────────────────

/**
 * Inicializa todas las tablas de la base de datos.
 * Se ejecuta de forma transaccional para garantizar atomicidad.
 */
function createTables() {
  db.exec(`
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
function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
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
  const seed = db.transaction(() => {
    // ─── 1. Admin user ───
    const admin = insertUser.run(
      'Administrador H&M', 'admin@hmservicios.com', adminHash,
      '+573001234567', 'Cra 7 #45-23, Bogotá', 4.6486, -74.0628,
      'admin', null
    );

    // ─── 2. Technicians (5 in the Bogotá area) ───
    const t1 = insertUser.run(
      'Carlos Martínez', 'carlos.martinez@email.com', techHash,
      '+573112345678', 'Cra 15 #80-25, Chapinero, Bogotá', 4.6585, -74.0579,
      'technician', null
    );
    insertTechProfile.run(
      t1.lastInsertRowid,
      JSON.stringify(['Instalación de gas', 'Mantenimiento de calentadores', 'Detección de fugas']),
      'Técnico certificado en gasodomésticos con 8 años de experiencia. Especialista en calentadores y estufas.',
      15, 4.8, 127, 12700000, 1, 'CC-1023456789', 'CERT-GAS-2024-001'
    );

    const t2 = insertUser.run(
      'María Rodríguez', 'maria.rodriguez@email.com', techHash,
      '+573123456789', 'Calle 100 #19-54, Usaquén, Bogotá', 4.6866, -74.0466,
      'technician', null
    );
    insertTechProfile.run(
      t2.lastInsertRowid,
      JSON.stringify(['Obra civil', 'Remodelación', 'Enchapes', 'Pintura']),
      'Ingeniera civil con amplia experiencia en remodelaciones residenciales y acabados de alta calidad.',
      20, 4.9, 89, 15800000, 1, 'CC-1034567890', 'CERT-OC-2024-002'
    );

    const t3 = insertUser.run(
      'Andrés López', 'andres.lopez@email.com', techHash,
      '+573134567890', 'Av. Suba #115-30, Suba, Bogotá', 4.7406, -74.0835,
      'technician', null
    );
    insertTechProfile.run(
      t3.lastInsertRowid,
      JSON.stringify(['Instalación de gas', 'Redes de gas', 'Certificación de gas']),
      'Técnico profesional en instalaciones de gas natural domiciliario. Certificado por Gas Natural Fenosa.',
      12, 4.6, 65, 8450000, 1, 'CC-1045678901', 'CERT-GAS-2024-003'
    );

    const t4 = insertUser.run(
      'Laura Gómez', 'laura.gomez@email.com', techHash,
      '+573145678901', 'Calle 63 #24-50, Barrios Unidos, Bogotá', 4.6612, -74.0739,
      'technician', null
    );
    insertTechProfile.run(
      t4.lastInsertRowid,
      JSON.stringify(['Plomería', 'Obra civil', 'Remodelación de baños', 'Impermeabilización']),
      'Especialista en plomería y obra civil con enfoque en remodelaciones de baños y cocinas.',
      18, 4.7, 103, 11200000, 1, 'CC-1056789012', 'CERT-OC-2024-004'
    );

    const t5 = insertUser.run(
      'Diego Hernández', 'diego.hernandez@email.com', techHash,
      '+573156789012', 'Cra 68 #13-45, Kennedy, Bogotá', 4.6188, -74.1185,
      'technician', null
    );
    insertTechProfile.run(
      t5.lastInsertRowid,
      JSON.stringify(['Mantenimiento de calentadores', 'Instalación de estufas', 'Revisión de gas']),
      'Técnico integral en gasodomésticos. Servicio a domicilio en el sur de Bogotá.',
      25, 4.5, 42, 4800000, 1, 'CC-1067890123', 'CERT-GAS-2024-005'
    );

    // ─── 3. Clients (3) ───
    const c1 = insertUser.run(
      'Ana Morales', 'ana.morales@email.com', clientHash,
      '+573167890123', 'Cra 11 #93-20, Chicó, Bogotá', 4.6780, -74.0479,
      'client', null
    );
    const c2 = insertUser.run(
      'Pedro Sánchez', 'pedro.sanchez@email.com', clientHash,
      '+573178901234', 'Calle 53 #14-30, Teusaquillo, Bogotá', 4.6378, -74.0692,
      'client', null
    );
    const c3 = insertUser.run(
      'Sofía Castro', 'sofia.castro@email.com', clientHash,
      '+573189012345', 'Av. Boyacá #64-25, Engativá, Bogotá', 4.6698, -74.1062,
      'client', null
    );

    // ─── 4. Services (4 gasodomésticos + 4 obra civil) ───
    const s1 = insertService.run(
      'Instalación de Calentador', 'gasodomesticos',
      'Instalación completa de calentador de agua a gas, incluye pruebas de funcionamiento y seguridad.',
      180000, '2-3 horas', 'flame'
    );
    const s2 = insertService.run(
      'Mantenimiento de Estufa', 'gasodomesticos',
      'Limpieza, calibración y revisión de seguridad de estufas a gas. Incluye cambio de empaques.',
      85000, '1-2 horas', 'tool'
    );
    const s3 = insertService.run(
      'Detección de Fugas de Gas', 'gasodomesticos',
      'Inspección completa de redes de gas domiciliario con equipos especializados para detección de fugas.',
      120000, '1 hora', 'alert-triangle'
    );
    const s4 = insertService.run(
      'Certificación de Red de Gas', 'gasodomesticos',
      'Revisión técnica reglamentaria y certificación de la red de gas natural según normativa vigente.',
      250000, '3-4 horas', 'check-circle'
    );
    const s5 = insertService.run(
      'Remodelación de Baño', 'obra_civil',
      'Remodelación integral de baño: enchapes, griferías, sanitarios y acabados. Mano de obra incluida.',
      2500000, '5-7 días', 'home'
    );
    const s6 = insertService.run(
      'Pintura Interior', 'obra_civil',
      'Servicio de pintura profesional para interiores, incluye preparación de superficies y dos manos de pintura.',
      350000, '2-3 días', 'paint-bucket'
    );
    const s7 = insertService.run(
      'Impermeabilización', 'obra_civil',
      'Impermeabilización de terrazas, cubiertas y muros con materiales de alta calidad y garantía.',
      450000, '2-3 días', 'droplet'
    );
    const s8 = insertService.run(
      'Reparación de Pisos y Enchapes', 'obra_civil',
      'Instalación y reparación de pisos en cerámica, porcelanato o madera. Incluye nivelación.',
      600000, '3-5 días', 'grid'
    );

    // ─── 5. Sample service requests ───
    // Completed request with payment and review
    const sr1 = insertRequest.run(
      c1.lastInsertRowid, t1.lastInsertRowid, s1.lastInsertRowid,
      'Necesito instalar un calentador nuevo en el baño principal.',
      'completed', 190000, '2026-05-20', '2026-05-20',
      4.6780, -74.0479, 'Cra 11 #93-20, Chicó, Bogotá'
    );

    insertPayment.run(
      sr1.lastInsertRowid, 190000, 28500, 161500, 'nequi', 'completed', 'HM-TXN-SEED-001'
    );

    insertReview.run(
      sr1.lastInsertRowid, c1.lastInsertRowid, t1.lastInsertRowid,
      5, 'Excelente servicio, muy profesional y puntual. Instalación perfecta.'
    );

    // Another completed request
    const sr2 = insertRequest.run(
      c2.lastInsertRowid, t2.lastInsertRowid, s5.lastInsertRowid,
      'Remodelación completa del baño de visitas.',
      'completed', 2800000, '2026-05-15', '2026-05-22',
      4.6378, -74.0692, 'Calle 53 #14-30, Teusaquillo, Bogotá'
    );

    insertPayment.run(
      sr2.lastInsertRowid, 2800000, 420000, 2380000, 'transfer', 'completed', 'HM-TXN-SEED-002'
    );

    insertReview.run(
      sr2.lastInsertRowid, c2.lastInsertRowid, t2.lastInsertRowid,
      5, 'Trabajo increíble, el baño quedó como nuevo. Muy recomendada.'
    );

    // In-progress request
    insertRequest.run(
      c3.lastInsertRowid, t4.lastInsertRowid, s7.lastInsertRowid,
      'Impermeabilizar la terraza del apartamento, hay filtraciones.',
      'in_progress', 500000, '2026-05-26', null,
      4.6698, -74.1062, 'Av. Boyacá #64-25, Engativá, Bogotá'
    );

    // Pending request
    insertRequest.run(
      c1.lastInsertRowid, t3.lastInsertRowid, s4.lastInsertRowid,
      'Necesito certificar la red de gas del apartamento nuevo.',
      'pending', null, '2026-05-30', null,
      4.6780, -74.0479, 'Cra 11 #93-20, Chicó, Bogotá'
    );

    // Accepted request
    insertRequest.run(
      c2.lastInsertRowid, t5.lastInsertRowid, s2.lastInsertRowid,
      'La estufa tiene baja presión en dos quemadores.',
      'accepted', 95000, '2026-05-28', null,
      4.6378, -74.0692, 'Calle 53 #14-30, Teusaquillo, Bogotá'
    );
  });

  seed(); // Execute the transaction
  console.log('  ✅ Datos semilla insertados correctamente.');
}

// ──────────────────────────────────────────────
// Inicialización
// ──────────────────────────────────────────────

/**
 * Ejecuta la creación de tablas y la carga de datos semilla.
 */
function initializeDatabase() {
  console.log('📦 Inicializando base de datos...');
  console.log(`   Ruta: ${DB_PATH}`);
  createTables();
  seedData();
  console.log('📦 Base de datos lista.\n');
}

module.exports = { db, initializeDatabase };
