const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');
const config = require('../config');
const fraudDetectionService = require('../services/fraudDetectionService');

class KafkaConsumer {
  constructor() {
    this.kafka = new Kafka({
      brokers: config.kafka.brokers,
      clientId: 'fraud-detection-service',
    });
    
    this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
    this.isConnected = false;
    this.retryQueue = [];
    this.isProcessingRetry = false;
  }

  async processWithRetry(transaction, attempt = 1) {
    try {
      await fraudDetectionService.processTransaction(transaction);
    } catch (error) {
      if (attempt <= 3) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        logger.warn(`Retrying transaction ${transaction.transactionId} (attempt ${attempt})`, {
          delay,
          error: error.message
        });
        
        this.retryQueue.push({
          transaction,
          attempt: attempt + 1,
          timestamp: Date.now() + delay
        });
        
        if (!this.isProcessingRetry) {
          this.processRetryQueue();
        }
      } else {
        logger.error(`Failed to process transaction after ${attempt} attempts`, {
          transactionId: transaction.transactionId,
          error: error.message
        });
      }
    }
  }

  async processRetryQueue() {
    this.isProcessingRetry = true;
    
    while (this.retryQueue.length > 0) {
      const now = Date.now();
      const readyItems = this.retryQueue.filter(item => item.timestamp <= now);
      
      for (const item of readyItems) {
        await this.processWithRetry(item.transaction, item.attempt);
        this.retryQueue = this.retryQueue.filter(i => i !== item);
      }
      
      if (this.retryQueue.length > 0) {
        const nextItem = this.retryQueue.reduce((min, item) => 
          item.timestamp < min.timestamp ? item : min
        );
        const delay = nextItem.timestamp - now;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    this.isProcessingRetry = false;
  }

  async connect() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ 
        topic: config.kafka.topicTransactions, 
        fromBeginning: false 
      });
      
      this.isConnected = true;
      logger.info('Kafka consumer connected and subscribed');
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const transaction = JSON.parse(message.value.toString());
            logger.info(`Received transaction: ${transaction.transactionId}`);
            
            await this.processWithRetry(transaction);
          } catch (error) {
            logger.error(`Error processing message: ${error.message}`, {
              topic,
              partition,
              offset: message.offset,
            });
          }
        },
      });
    } catch (error) {
      logger.error(`Failed to connect Kafka consumer: ${error.message}`);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.consumer.disconnect();
      this.isConnected = false;
      logger.info('Kafka consumer disconnected');
    } catch (error) {
      logger.error(`Error disconnecting consumer: ${error.message}`);
    }
  }
}

module.exports = new KafkaConsumer();