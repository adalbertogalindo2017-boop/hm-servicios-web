/**
 * @module server/middleware/validation
 * @description Reglas de validación con express-validator y middleware de manejo de errores.
 */

const { body, param, query, validationResult } = require('express-validator');

// ──────────────────────────────────────────────
// Middleware para manejar errores de validación
// ──────────────────────────────────────────────

/**
 * Middleware que verifica los resultados de express-validator.
 * Si hay errores, devuelve un 400 con la lista de errores formateada.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Error de validación.',
      errors: formattedErrors,
    });
  }
  next();
}

// ──────────────────────────────────────────────
// Reglas de validación por entidad
// ──────────────────────────────────────────────

/**
 * Validación para registro de usuario.
 */
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),

  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('Correo electrónico no válido.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula.')
    .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula.')
    .matches(/\d/).withMessage('La contraseña debe contener al menos un número.')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe contener al menos un carácter especial.'),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s-]{7,15}$/).withMessage('Número de teléfono no válido.'),

  body('role')
    .optional()
    .isIn(['client', 'technician']).withMessage('El rol debe ser "client" o "technician".'),

  handleValidationErrors,
];

/**
 * Validación para inicio de sesión.
 */
const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('Correo electrónico no válido.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.'),

  handleValidationErrors,
];

/**
 * Validación para creación de servicio (admin).
 */
const serviceRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre del servicio es obligatorio.')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.'),

  body('category')
    .trim()
    .notEmpty().withMessage('La categoría es obligatoria.')
    .isIn(['gasodomesticos', 'obra_civil']).withMessage('Categoría no válida. Use "gasodomesticos" o "obra_civil".'),

  body('base_price')
    .notEmpty().withMessage('El precio base es obligatorio.')
    .isFloat({ min: 1000 }).withMessage('El precio debe ser al menos $1.000 COP.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres.'),

  body('estimated_time')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El tiempo estimado no puede exceder 50 caracteres.'),

  handleValidationErrors,
];

/**
 * Validación para creación de solicitud de servicio.
 */
const serviceRequestRules = [
  body('technician_id')
    .notEmpty().withMessage('El ID del técnico es obligatorio.')
    .isInt({ min: 1 }).withMessage('ID de técnico no válido.'),

  body('service_id')
    .notEmpty().withMessage('El ID del servicio es obligatorio.')
    .isInt({ min: 1 }).withMessage('ID de servicio no válido.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres.'),

  body('scheduled_date')
    .optional()
    .isISO8601().withMessage('La fecha debe tener formato ISO 8601 (YYYY-MM-DD).'),

  body('client_address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('La dirección no puede exceder 200 caracteres.'),

  handleValidationErrors,
];

/**
 * Validación para creación de reseña.
 */
const reviewRules = [
  body('service_request_id')
    .notEmpty().withMessage('El ID de la solicitud es obligatorio.')
    .isInt({ min: 1 }).withMessage('ID de solicitud no válido.'),

  body('rating')
    .notEmpty().withMessage('La calificación es obligatoria.')
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe estar entre 1 y 5.'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('El comentario no puede exceder 500 caracteres.'),

  handleValidationErrors,
];

/**
 * Validación para procesamiento de pago.
 */
const paymentRules = [
  body('service_request_id')
    .notEmpty().withMessage('El ID de la solicitud es obligatorio.')
    .isInt({ min: 1 }).withMessage('ID de solicitud no válido.'),

  body('amount')
    .notEmpty().withMessage('El monto es obligatorio.')
    .isFloat({ min: 1000 }).withMessage('El monto debe ser al menos $1.000 COP.'),

  body('payment_method')
    .notEmpty().withMessage('El método de pago es obligatorio.')
    .isIn(['cash', 'transfer', 'card', 'nequi', 'daviplata'])
    .withMessage('Método de pago no válido. Use: cash, transfer, card, nequi o daviplata.'),

  handleValidationErrors,
];

/**
 * Validación para parámetro id en URL.
 */
const idParamRule = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID no válido.'),
  handleValidationErrors,
];

/**
 * Validación para parámetros de búsqueda de técnicos cercanos.
 */
const nearbySearchRules = [
  query('lat')
    .notEmpty().withMessage('La latitud es obligatoria.')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitud fuera de rango (-90 a 90).'),

  query('lng')
    .notEmpty().withMessage('La longitud es obligatoria.')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitud fuera de rango (-180 a 180).'),

  query('radius')
    .optional()
    .isFloat({ min: 1, max: 100 }).withMessage('El radio debe estar entre 1 y 100 km.'),

  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  registerRules,
  loginRules,
  serviceRules,
  serviceRequestRules,
  reviewRules,
  paymentRules,
  idParamRule,
  nearbySearchRules,
};
