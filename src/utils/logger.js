const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, printf } = format;

// Custom format that includes transaction details for fraud logs
const fraudFormat = printf(({ level, message, timestamp, transactionId, userId, rule }) => {
  return JSON.stringify({
    timestamp,
    level,
    transactionId,
    userId,
    rule,
    message,
  });
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/combined.log' }),
    new transports.File({ 
      filename: 'logs/fraud.log', 
      level: 'warn',
      format: fraudFormat
    }),
  ],
});

module.exports = logger;