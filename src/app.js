require('dotenv').config();
const express = require('express');
const logger = require('./utils/logger');
const config = require('./config');
const kafkaConsumer = require('./kafka/consumer');
const routes = require('./routes');

class App {
  constructor() {
    this.app = express();
    this.server = null;
    this.setupMiddlewares();
    this.setupRoutes();
  }

  setupMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    this.app.use('/', routes);
    
    // Error handling middleware
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error', { 
        error: err.message,
        stack: err.stack 
      });
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  async start() {
    try {
      logger.info('Starting application...');
      
      // Connect to Kafka
      logger.info('Connecting to Kafka...');
      await kafkaConsumer.connect();
      
      // Start HTTP server
      this.server = this.app.listen(config.app.port, () => {
        logger.info(`Server running on port ${config.app.port}`);
      });
      
      // Keep the process alive
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));
      
      // Prevent immediate exit
      setInterval(() => {}, 1000);

    } catch (error) {
      logger.error('Failed to start application', { error: error.message });
      process.exit(1);
    }
  }

  async gracefulShutdown() {
    logger.info('Shutting down gracefully...');
    
    try {
      // Disconnect Kafka consumer
      await kafkaConsumer.disconnect();
      
      // Close HTTP server
      if (this.server) {
        this.server.close(() => {
          logger.info('Server closed');
        });
      }
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
    } finally {
      process.exit(0);
    }
  }
}

// Start the application
const app = new App();
app.start().catch(err => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});