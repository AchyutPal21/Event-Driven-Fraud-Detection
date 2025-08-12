const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');
const { validateUserId } = require('../middlewares/validation');
const { client } = require('../utils/metrics');

// Fraud routes
router.get('/frauds', fraudController.getAllFrauds);
router.get('/frauds/:userId', validateUserId, fraudController.getFraudsByUser);

// Health check
router.get('/health', fraudController.healthCheck);

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

module.exports = router;