/**
 * @module server/utils/helpers
 * @description Funciones utilitarias compartidas para toda la aplicación.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Genera un JWT de acceso.
 * @param {Object} payload - Datos a incluir en el token (id, email, role).
 * @param {string} [expiresIn='24h'] - Tiempo de expiración.
 * @returns {string} Token JWT firmado.
 */
function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/**
 * Genera un JWT de refresco con mayor duración.
 * @param {Object} payload - Datos a incluir en el token.
 * @returns {string} Refresh token JWT firmado.
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Formatea un número como moneda colombiana (COP).
 * @param {number} amount - Cantidad a formatear.
 * @returns {string} Cadena formateada, e.g. "$150.000 COP".
 */
function formatCurrency(amount) {
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return formatted;
}

/**
 * Genera un identificador de transacción único.
 * Formato: HM-<timestamp_hex>-<random_hex>
 * @returns {string} ID de transacción único.
 */
function generateTransactionId() {
  const timestamp = Date.now().toString(16).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `HM-${timestamp}-${random}`;
}

/**
 * Aplica paginación a una consulta SQL y devuelve resultados + metadatos.
 * @param {object} db - Instancia de la base de datos (shim async sobre @libsql/client).
 * @param {string} query - Consulta SQL base (sin LIMIT/OFFSET).
 * @param {Array} params - Parámetros de la consulta.
 * @param {number} [page=1] - Página actual (1-indexed).
 * @param {number} [limit=10] - Resultados por página.
 * @returns {Promise<{ data: Array, pagination: Object }>} Resultados paginados.
 */
async function paginateResults(db, query, params = [], page = 1, limit = 10) {
  // Ensure valid positive integers
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (page - 1) * limit;

  // Count total rows using a subquery
  const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
  const { total } = await db.prepare(countQuery).get(...params);

  // Fetch the requested page
  const paginatedQuery = `${query} LIMIT ? OFFSET ?`;
  const data = await db.prepare(paginatedQuery).all(...params, limit, offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

module.exports = {
  generateToken,
  generateRefreshToken,
  formatCurrency,
  generateTransactionId,
  paginateResults,
};
