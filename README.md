# Fraud Detection Microservice

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933)](https://nodejs.org/)
[![Kafka](https://img.shields.io/badge/Kafka-3.0-231F20)](https://kafka.apache.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/yourusername/fraud-detection.git
cd fraud-detection
npm install

# 2. Start dependencies (Kafka)
docker-compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Run the service
npm start


## 🔍 What It Does

- **Consumes** transactions from Kafka  
- **Detects** fraud using 3 rules:
  1. High amount (>$5000) + foreign location
  2. Rapid transactions (<10s apart)  
  3. Round number amounts ($1000, $2000 etc.)
- **Stores** fraud cases in SQLite
- **Provides** REST API for querying frauds

## 📡 API Endpoints

| Endpoint | Method | Description | Example Response |
|----------|--------|-------------|------------------|
| `/frauds` | GET | List all frauds | `[{id: 1, amount: 6000, reasons: ["highAmountForeign"]}]` |
| `/frauds/user_123` | GET | Get frauds by user | `[{id: 1, amount: 1000, reasons: ["roundAmount"]}]` |
| `/health` | GET | Health check | `{"status":"healthy"}` |
| `/metrics` | GET | Prometheus metrics | Metrics in Prom format |

## 🛠️ Development

```bash
# Run with hot reload
npm run dev

# Run tests
npm test

# Produce test transactions
node produce-transaction.js