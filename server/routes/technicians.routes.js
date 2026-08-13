const express = require('express');
const router = express.Router();
const techniciansController = require('../controllers/technicians.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', techniciansController.getAll);
router.get('/nearby', techniciansController.getNearby);
router.get('/:id', techniciansController.getById);

// Technician only routes
router.put('/profile', verifyToken, requireRole('technician'), techniciansController.updateProfile);
router.post('/availability', verifyToken, requireRole('technician'), techniciansController.toggleAvailability);

module.exports = router;
