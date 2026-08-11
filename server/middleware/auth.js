/**
 * @module server/middleware/auth
 * @description Middleware de autenticación y autorización basado en JWT.
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica el token JWT del header Authorization.
 * Adjunta el usuario decodificado a `req.user`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Token no proporcionado.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor, inicie sesión de nuevo.',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Token inválido.',
    });
  }
}

/**
 * Middleware factory que verifica que el usuario tenga uno de los roles permitidos.
 *
 * @param {...string} roles - Roles permitidos (e.g. 'admin', 'technician', 'client').
 * @returns {import('express').RequestHandler} Middleware de autorización.
 *
 * @example
 * router.get('/admin/dashboard', verifyToken, requireRole('admin'), handler);
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}.`,
      });
    }

    next();
  };
}

/**
 * Middleware de autenticación opcional.
 * Si hay un token válido, adjunta el usuario a `req.user`.
 * Si no hay token o es inválido, continúa sin error (req.user será undefined).
 * Útil para rutas públicas que pueden personalizar la respuesta si hay usuario.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Token invalid — continue without user context
  }

  next();
}

module.exports = { verifyToken, requireRole, optionalAuth };
