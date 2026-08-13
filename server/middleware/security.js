/**
 * @module server/middleware/security
 * @description Middleware de seguridad: Helmet, CORS, rate limiting y sanitización.
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

/**
 * Configuración de Helmet con defaults sensatos.
 * En desarrollo se relaja la Content Security Policy para facilitar pruebas.
 */
const helmetConfig = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
    ? undefined  // Use strict defaults in production
    : false,     // Disable in development for easier testing
  crossOriginEmbedderPolicy: false,
});

/**
 * Configuración de CORS.
 * Permite orígenes configurados vía CORS_ORIGINS y el propio servidor (same origin).
 */
const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, curl, mobile apps)
    if (!origin) return callback(null, true);

    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim());

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por la política CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

/**
 * Rate limiter general: 100 solicitudes por ventana de 15 minutos por IP.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Por favor, intente de nuevo en 15 minutos.',
  },
});

/**
 * Rate limiter para autenticación: 5 intentos por ventana de 15 minutos por IP.
 * Previene ataques de fuerza bruta contra login/registro.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intente de nuevo en 15 minutos.',
  },
});

/**
 * Middleware que sanitiza entradas de texto eliminando etiquetas HTML.
 * Procesa recursivamente los campos del body de la solicitud.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function sanitizeInput(req, _res, next) {
  /**
   * Elimina etiquetas HTML de una cadena.
   * @param {string} str
   * @returns {string}
   */
  const stripTags = (str) => str.replace(/<[^>]*>/g, '');

  /**
   * Sanitiza recursivamente un objeto o valor.
   * @param {*} obj
   * @returns {*}
   */
  const sanitize = (obj) => {
    if (typeof obj === 'string') return stripTags(obj).trim();
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (obj && typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = sanitize(value);
      }
      return cleaned;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
}

module.exports = {
  helmetConfig,
  corsConfig,
  generalLimiter,
  authLimiter,
  sanitizeInput,
};
