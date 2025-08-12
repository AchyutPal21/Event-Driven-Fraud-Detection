const fraudController = require('../../src/controllers/fraudController');
const fraudStorage = require('../../src/models/fraudStorage');

jest.mock('../../src/models/fraudStorage');
jest.mock('../../src/utils/logger');

describe('FraudController', () => {
  describe('getAllFrauds', () => {
    it('should return all frauds', async () => {
      const mockFrauds = [{ id: 1, transactionId: 'txn_1' }];
      fraudStorage.getAllFrauds.mockResolvedValue(mockFrauds);
      
      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await fraudController.getAllFrauds(req, res);
      expect(res.json).toHaveBeenCalledWith(mockFrauds);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      fraudStorage.getAllFrauds.mockRejectedValue(error);
      
      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await fraudController.getAllFrauds(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  
  describe('getFraudsByUser', () => {
    it('should return frauds for user', async () => {
      const mockFrauds = [{ id: 1, transactionId: 'txn_1', userId: 'user_1' }];
      fraudStorage.getFraudsByUser.mockResolvedValue(mockFrauds);
      
      const req = {
        params: { userId: 'user_1' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await fraudController.getFraudsByUser(req, res);
      expect(res.json).toHaveBeenCalledWith(mockFrauds);
    });

    it('should return 404 if no frauds found', async () => {
      fraudStorage.getFraudsByUser.mockResolvedValue([]);
      
      const req = {
        params: { userId: 'user_1' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await fraudController.getFraudsByUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', () => {
      const req = {};
      const res = {
        json: jest.fn()
      };
      
      fraudController.healthCheck(req, res);
      expect(res.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String)
      });
    });
  });
});