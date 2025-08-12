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
  { transactionId: 'txn_f1', userId: 'user_1', amount: 6000, location: 'Nigeria', timestamp: new Date().toISOString() },
  
  // Fraud: Round number amount
  { transactionId: 'txn_f2', userId: 'user_2', amount: 1000, location: 'USA', timestamp: new Date().toISOString() },
  { transactionId: 'txn_f3', userId: 'user_2', amount: 2000, location: 'USA', timestamp: new Date().toISOString() },
  { transactionId: 'txn_f4', userId: 'user_2', amount: 4000, location: 'USA', timestamp: new Date().toISOString() },
  { transactionId: 'txn_f5', userId: 'user_2', amount: 5000, location: 'USA', timestamp: new Date().toISOString() },
  { transactionId: 'txn_f6', userId: 'user_2', amount: 5000, location: 'USA', timestamp: new Date().toISOString() },
  { transactionId: 'txn_f7', userId: 'user_2', amount: 5000, location: 'USA', timestamp: new Date().toISOString() },
  { transactionId: 'txn_f8', userId: 'user_2', amount: 5000, location: 'USA', timestamp: new Date().toISOString() },
  { transactionId: 'txn_f9', userId: 'user_2', amount: 5000, location: 'USA', timestamp: new Date().toISOString() },
  { transactionId: 'txn_f10', userId: 'user_2', amount: 5000, location: 'USA', timestamp: new Date().toISOString() },
  { transactionId: 'txn_f11', userId: 'user_2', amount: 5000, location: 'USA', timestamp: new Date().toISOString() },
  
  // Normal transaction
  { transactionId: 'txn_n12', userId: 'user_3', amount: 1234, location: 'USA', timestamp: new Date().toISOString() }
];

// Send all transactions
Promise.all(transactions.map(sendTransaction)).catch(console.error);

module.exports = {sendTransaction};