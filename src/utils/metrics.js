const client = require('prom-client');

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const transactionsProcessed = new client.Counter({
  name: 'fraud_detection_transactions_processed_total',
  help: 'Total number of transactions processed',
  labelNames: ['status']
});

const fraudDetected = new client.Counter({
  name: 'fraud_detection_fraudulent_transactions_total',
  help: 'Total number of fraudulent transactions detected',
  labelNames: ['rule']
});

const processingTime = new client.Histogram({
  name: 'fraud_detection_processing_time_seconds',
  help: 'Time taken to process a transaction',
  buckets: [0.1, 0.5, 1, 2, 5]
});

module.exports = {
  transactionsProcessed,
  fraudDetected,
  processingTime,
  client
};