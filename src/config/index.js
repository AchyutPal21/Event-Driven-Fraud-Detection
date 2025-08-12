require('dotenv').config();

module.exports = {
  kafka: {
    brokers: process.env.KAFKA_BROKERS.split(','),
    topicTransactions: process.env.KAFKA_TOPIC_TRANSACTIONS,
    groupId: process.env.KAFKA_GROUP_ID,
  },
  app: {
    port: process.env.PORT || 3000,
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};