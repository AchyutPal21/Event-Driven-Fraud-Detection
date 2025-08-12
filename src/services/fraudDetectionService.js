const logger = require('../utils/logger');
const fraudStorage = require('../models/fraudStorage');
const NodeCache = require('node-cache');
const metrics = require('../utils/metrics');

class FraudDetectionService {
  constructor() {
    this.transactionCache = new NodeCache({ stdTTL: 10 }); // Cache for 10 seconds
    this.rules = [
      { name: 'highAmountForeign', fn: this.checkHighAmountForeign.bind(this) },
      { name: 'rapidTransactions', fn: this.checkRapidTransactions.bind(this) },
      { name: 'roundAmount', fn: this.checkRoundAmount.bind(this) },
    ];
  }

  async processTransaction(transaction) {
    const endTimer = metrics.processingTime ? metrics.processingTime.startTimer() : () => {};
    try {
      if (metrics.transactionsProcessed) {
        metrics.transactionsProcessed.inc({ status: 'received' });
      }
      
      const fraudReasons = [];
      
      for (const rule of this.rules) {
        const result = await rule.fn(transaction);
        if (result.isFraud) {
          fraudReasons.push(rule.name);
        }
      }
      
      if (fraudReasons.length > 0) {
        if (metrics.fraudDetected && metrics.transactionsProcessed) {
          fraudReasons.forEach(rule => {
            metrics.fraudDetected.inc({ rule });
          });
          metrics.transactionsProcessed.inc({ status: 'fraud' });
        }
        
        const fraudData = {
          ...transaction,
          reasons: fraudReasons,
          timestamp: new Date().toISOString(),
        };
        
        logger.warn('Fraud detected', {
          transactionId: transaction.transactionId,
          userId: transaction.userId,
          rule: fraudReasons.join(', '),
          message: `Fraud detected for transaction ${transaction.transactionId}`,
        });
        
        await fraudStorage.addFraud(fraudData);
      } else if (metrics.transactionsProcessed) {
        metrics.transactionsProcessed.inc({ status: 'clean' });
      }
    } catch (error) {
      logger.error(`Error processing transaction: ${error.message}`, {
        transactionId: transaction.transactionId,
      });
      throw error;
    } finally {
      endTimer();
    }
  }

  checkHighAmountForeign(transaction) {
    const isFraud = transaction.amount > 5000 && transaction.location !== 'USA';
    return { isFraud };
  }

  checkRapidTransactions(transaction) {
    const userTransactions = this.transactionCache.get(transaction.userId) || [];
    
    const recentTransactions = userTransactions.filter(
      txn => new Date() - new Date(txn.timestamp) < 10000
    );
    
    const isFraud = recentTransactions.length > 0;
    
    this.transactionCache.set(transaction.userId, [...userTransactions, transaction]);
    
    return { isFraud };
  }

  checkRoundAmount(transaction) {
    const isFraud = transaction.amount % 1000 === 0;
    return { isFraud };
  }

  // For testing purposes
  clearCache() {
    this.transactionCache.flushAll();
  }
}

module.exports = new FraudDetectionService();