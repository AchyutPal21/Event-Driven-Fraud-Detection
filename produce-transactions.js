const { Kafka } = require('kafkajs');
const config = require('./src/config');

const kafka = new Kafka({
  brokers: ['localhost:29092'],
  clientId: 'transaction-producer'
});

const producer = kafka.producer();

async function sendTransaction(transaction) {
  await producer.connect();
  await producer.send({
    topic: config.kafka.topicTransactions,
    messages: [{ value: JSON.stringify(transaction) }]
  });
  console.log(`Sent transaction: ${transaction.transactionId}`);
  await producer.disconnect();
}

// Example transactions (including fraud cases)
const transactions = [
  // Fraud: High amount + non-USA location
  { transactionId: 'txn_f110', userId: 'user_100', amount: 6000, location: 'Nigeria', timestamp: new Date().toISOString() },
  
  // Fraud: Round number amount
  { transactionId: 'txn_f210', userId: 'user_200', amount: 1000, location: 'USA', timestamp: new Date().toISOString() },

  // Normal transaction
  { transactionId: 'txn_n120', userId: 'user_300', amount: 1234, location: 'USA', timestamp: new Date().toISOString() }
];

// Send all transactions
Promise.all(transactions.map(sendTransaction)).catch(console.error);

module.exports = {sendTransaction};