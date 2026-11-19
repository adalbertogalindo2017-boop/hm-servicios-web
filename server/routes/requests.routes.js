const express = require('express');
const router = express.Router();
const requestsController = require('../controllers/requests.controller');
const { verifyToken, requireRole } = require('../middleware/auth');
const { serviceRequestRules } = require('../middleware/validation');

router.use(verifyToken); // All routes require auth

router.post('/', requireRole('client'), serviceRequestRules, requestsController.create);
router.get('/', requestsController.getMyRequests);
router.get('/:id', requestsController.getById);
router.put('/:id/status', requestsController.updateStatus);
router.post('/:id/cancel', requestsController.cancel);

module.exports = router;
