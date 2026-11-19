const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');
// registerRules/loginRules existían en validation.js desde antes pero nunca
// se habían conectado aquí: la ruta real de registro/login no pasaba por
// NINGÚN middleware de validación, así que el servidor aceptaba cualquier
// cosa (contraseña de 1 carácter, "email" sin arroba) sin importar lo que
// validara el navegador, que cualquiera puede saltarse con una petición
// directa a la API.
const { registerRules, loginRules, forgotPasswordRules } = require('../middleware/validation');

router.post('/register', registerRules, authController.register);
router.post('/login', loginRules, authController.login);
router.post('/forgot-password', forgotPasswordRules, authController.forgotPassword);
router.post('/refresh', authController.refreshToken);
router.get('/me', verifyToken, authController.getProfile);
router.put('/me', verifyToken, authController.updateProfile);

module.exports = router;
