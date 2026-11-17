#!/usr/bin/env node
/**
 * @module scripts/create-admin
 * @description Script de línea de comandos para crear (o actualizar a rol
 * 'admin') un usuario administrador directamente en la base de datos, sin
 * pasar por la API. Útil para el arranque inicial del sistema, cuando
 * todavía no existe ningún administrador que pueda usar el panel para crear
 * al primero.
 *
 * El registro público (POST /api/auth/register) NUNCA permite crear un
 * admin por diseño (ver server/controllers/auth.controller.js), así que
 * este script, junto con el panel de administración una vez que ya exista
 * un admin, es una de las dos únicas vías para obtener una cuenta admin.
 *
 * Uso:
 *   node scripts/create-admin.js "Nombre Admin" admin@correo.com "ClaveSegura123!" [telefono]
 *
 * Si el email ya existe, el usuario se actualiza a role='admin' (y se
 * reemplaza la contraseña por la indicada) en lugar de crear uno duplicado.
 *
 * Variables de entorno relevantes (las mismas que usa el servidor):
 *   DB_PATH   - ruta al archivo SQLite (por defecto ./data/hm_servicios.db)
 *   VERCEL    - si está definida, usa /tmp/hm_servicios.db (como el server)
 */

const bcrypt = require('bcryptjs');
const { db } = require('../server/config/database');

function main() {
  const [, , name, email, password, phone] = process.argv;

  if (!name || !email || !password) {
    console.error('Uso: node scripts/create-admin.js "Nombre Admin" admin@correo.com "ClaveSegura123!" [telefono]');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: la contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(email);

  if (existing) {
    db.prepare('UPDATE users SET name = ?, password_hash = ?, role = ?, is_active = 1 WHERE id = ?')
      .run(name, password_hash, 'admin', existing.id);
    console.log(`✔ Usuario existente (id=${existing.id}, rol anterior="${existing.role}") actualizado a administrador.`);
    console.log(`  Email: ${email}`);
  } else {
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, role, is_active)
      VALUES (?, ?, ?, ?, 'admin', 1)
    `).run(name, email, password_hash, phone || null);
    console.log(`✔ Administrador creado (id=${result.lastInsertRowid}).`);
    console.log(`  Email: ${email}`);
  }

  console.log('\nYa puedes iniciar sesión con estas credenciales desde /#login y accederás al panel de administración.');
}

main();
