const fraudDetectionService = require('../../src/services/fraudDetectionService');
const fraudStorage = require('../../src/models/fraudStorage');
const logger = require('../../src/utils/logger');

jest.mock('../../src/utils/logger');
jest.mock('../../src/models/fraudStorage');
jest.mock('../../src/utils/metrics', () => ({
  transactionsProcessed: {
    inc: jest.fn()
  },
  fraudDetected: {
    inc: jest.fn()
  },
  processingTime: {
    startTimer: jest.fn(() => jest.fn()) // Returns a mock function for endTimer
  },
  client: {}
}));

const metrics = require('../../src/utils/metrics');

describe('Fraud Detection Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fraudDetectionService.clearCache();
  });

  describe('checkHighAmountForeign', () => {
    it('should flag transactions > $5000 not in USA', () => {
      const transaction = {
        amount: 5001,
        location: 'Nigeria'
      };
      const result = fraudDetectionService.checkHighAmountForeign(transaction);
      expect(result.isFraud).toBe(true);
    });

    it('should not flag transactions <= $5000', () => {
      const transaction = {
        amount: 5000,
        location: 'Nigeria'
      };
      const result = fraudDetectionService.checkHighAmountForeign(transaction);
      expect(result.isFraud).toBe(false);
    });

    it('should not flag US transactions regardless of amount', () => {
      const transaction = {
        amount: 10000,
        location: 'USA'
      };
      const result = fraudDetectionService.checkHighAmountForeign(transaction);
      expect(result.isFraud).toBe(false);
    });
  });

  describe('checkRoundAmount', () => {
    it('should flag amounts divisible by 1000', () => {
      const transaction = { amount: 1000 };
      const result = fraudDetectionService.checkRoundAmount(transaction);
      expect(result.isFraud).toBe(true);
    });

    it('should not flag amounts not divisible by 1000', () => {
      const transaction = { amount: 1001 };
      const result = fraudDetectionService.checkRoundAmount(transaction);
      expect(result.isFraud).toBe(false);
    });
  });

  describe('checkRapidTransactions', () => {
    it('should flag multiple transactions from same user within 10 seconds', () => {
      const transaction1 = {
        transactionId: 'txn_1',
        userId: 'user_1',
        amount: 100,
        location: 'USA',
        timestamp: new Date().toISOString()
      };
      
      const transaction2 = {
        transactionId: 'txn_2',
        userId: 'user_1',
        amount: 200,
        location: 'USA',
        timestamp: new Date().toISOString()
      };

      // First transaction should be clean
      const result1 = fraudDetectionService.checkRapidTransactions(transaction1);
      expect(result1.isFraud).toBe(false);
      
      // Second transaction should be flagged
      const result2 = fraudDetectionService.checkRapidTransactions(transaction2);
      expect(result2.isFraud).toBe(true);
    });

    it('should not flag transactions from different users', () => {
      const transaction1 = {
        transactionId: 'txn_1',
        userId: 'user_1',
        amount: 100,
        location: 'USA',
        timestamp: new Date().toISOString()
      };
      
      const transaction2 = {
        transactionId: 'txn_2',
        userId: 'user_2',
        amount: 200,
        location: 'USA',
        timestamp: new Date().toISOString()
      };

      const result1 = fraudDetectionService.checkRapidTransactions(transaction1);
      const result2 = fraudDetectionService.checkRapidTransactions(transaction2);
      
      expect(result1.isFraud).toBe(false);
      expect(result2.isFraud).toBe(false);
    });
  });

  describe('processTransaction', () => {
    it('should call metrics for successful processing', async () => {
      const transaction = {
        transactionId: 'txn_1',
        userId: 'user_1',
        amount: 100,
        location: 'USA',
        timestamp: new Date().toISOString()
      };
      
      await fraudDetectionService.processTransaction(transaction);
      
      expect(metrics.transactionsProcessed.inc).toHaveBeenCalledWith({ status: 'received' });
      expect(metrics.transactionsProcessed.inc).toHaveBeenCalledWith({ status: 'clean' });
      expect(metrics.processingTime.startTimer).toHaveBeenCalled();
    });

    it('should detect and log fraud', async () => {
      const transaction = {
        transactionId: 'txn_fraud',
        userId: 'user_1',
        amount: 6000,
        location: 'Nigeria',
        timestamp: new Date().toISOString()
      };
      
      await fraudDetectionService.processTransaction(transaction);
      
      expect(metrics.fraudDetected.inc).toHaveBeenCalledWith({ rule: 'highAmountForeign' });
      expect(metrics.transactionsProcessed.inc).toHaveBeenCalledWith({ status: 'received' });
      expect(metrics.transactionsProcessed.inc).toHaveBeenCalledWith({ status: 'fraud' });
      expect(metrics.processingTime.startTimer).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should store fraud in database when detected', async () => {
      const transaction = {
        transactionId: 'txn_fraud',
        userId: 'user_1',
        amount: 6000,
        location: 'Nigeria',
        timestamp: new Date().toISOString()
      };
      
      await fraudDetectionService.processTransaction(transaction);
      
      expect(fraudStorage.addFraud).toHaveBeenCalled();
    });
  });
});