const fraudStorage = require('../models/fraudStorage');
const logger = require('../utils/logger');

class FraudController {
  async getAllFrauds(req, res) {
    try {
      const frauds = await fraudStorage.getAllFrauds();
      res.json(frauds);
    } catch (error) {
      logger.error('Error fetching all frauds', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getFraudsByUser(req, res) {
    try {
      const { userId } = req.params;
      const frauds = await fraudStorage.getFraudsByUser(userId);
      
      if (frauds.length === 0) {
        return res.status(404).json({ 
          message: 'No frauds found for this user' 
        });
      }
      
      res.json(frauds);
    } catch (error) {
      logger.error('Error fetching user frauds', { 
        userId: req.params.userId,
        error: error.message 
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  healthCheck(req, res) {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = new FraudController();