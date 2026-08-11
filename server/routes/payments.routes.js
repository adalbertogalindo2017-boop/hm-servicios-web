const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole('client'), paymentsController.processPayment);
router.get('/history', paymentsController.getHistory);
router.get('/:id', paymentsController.getPaymentDetail);

module.exports = router;
