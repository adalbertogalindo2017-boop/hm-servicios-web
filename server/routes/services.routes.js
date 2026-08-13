const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/services.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', servicesController.getAll);
router.get('/:id', servicesController.getById);

// Admin only routes
router.post('/', verifyToken, requireRole('admin'), servicesController.create);
router.put('/:id', verifyToken, requireRole('admin'), servicesController.update);
router.delete('/:id', verifyToken, requireRole('admin'), servicesController.deleteService);

module.exports = router;
