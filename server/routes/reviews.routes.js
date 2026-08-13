const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/technician/:id', reviewsController.getByTechnician);
router.post('/', verifyToken, requireRole('client'), reviewsController.create);

module.exports = router;
