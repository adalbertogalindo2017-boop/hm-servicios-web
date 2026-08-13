const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getAllUsers);
router.post('/users/:id/toggle', adminController.toggleUserStatus);
router.get('/payouts', adminController.getPayouts);
router.post('/payouts/:id/process', adminController.processPayout);
router.get('/revenue', adminController.getRevenueReport);

module.exports = router;
