const sqlite3 = require('sqlite3').verbose();
const logger = require('../utils/logger');
const path = require('path');

class FraudStorage {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/frauds.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.initializeDatabase();
  }

  initializeDatabase() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS frauds (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transactionId TEXT UNIQUE,
          userId TEXT,
          amount REAL,
          location TEXT,
          reasons TEXT,
          timestamp TEXT,
          detectedAt TEXT
        )
      `);
    });
  }

  async addFraud(fraudData) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO frauds 
        (transactionId, userId, amount, location, reasons, timestamp, detectedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          fraudData.transactionId,
          fraudData.userId,
          fraudData.amount,
          fraudData.location,
          JSON.stringify(fraudData.reasons),
          fraudData.timestamp,
          new Date().toISOString(),
        ],
        function (error) {
          if (error) {
            logger.error('Error storing fraud', { error: error.message });
            reject(error);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  async getAllFrauds() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM frauds ORDER BY detectedAt DESC', (error, rows) => {
        if (error) {
          reject(error);
        } else {
          resolve(rows.map(row => ({
            ...row,
            reasons: JSON.parse(row.reasons),
          })));
        }
      });
    });
  }

  async getFraudsByUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM frauds WHERE userId = ? ORDER BY detectedAt DESC',
        [userId],
        (error, rows) => {
          if (error) {
            reject(error);
          } else {
            resolve(rows.map(row => ({
              ...row,
              reasons: JSON.parse(row.reasons),
            })));
          }
        }
      );
    });
  }
}

module.exports = new FraudStorage();