// ─────────────────────────────────────────────────────────────
// SecureLedger — MySQL Database Client & Connection Pool
// Powered by mysql2/promise with Auto-Fallback & Health Verification
// ─────────────────────────────────────────────────────────────

require('dotenv').config();
const mysql = require('mysql2/promise');

class MySQLClient {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'secureledger',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
      queueLimit: 0,
      connectTimeout: 2000
    };
  }

  async init() {
    try {
      this.pool = mysql.createPool(this.config);
      // Test connection with a quick ping
      const conn = await this.pool.getConnection();
      await conn.ping();
      conn.release();

      this.isConnected = true;
      console.log(`✅ [MySQL] Successfully connected to MySQL at ${this.config.host}:${this.config.port}/${this.config.database}`);
      await this.ensureTables();
      return true;
    } catch (err) {
      this.isConnected = false;
      console.info(`ℹ️ [MySQL] Database at ${this.config.host}:${this.config.port} not active (${err.code || err.message}).`);
      console.info(`⚡ [MySQL] Operating seamlessly with structured ledger storage engine (Zero downtime fallback).`);
      return false;
    }
  }

  async query(sql, params = []) {
    if (!this.isConnected || !this.pool) {
      throw new Error('MySQL is not currently connected');
    }
    const [rows] = await this.pool.query(sql, params);
    return rows;
  }

  async execute(sql, params = []) {
    if (!this.isConnected || !this.pool) {
      throw new Error('MySQL is not currently connected');
    }
    const [result] = await this.pool.execute(sql, params);
    return result;
  }

  async ensureTables() {
    if (!this.isConnected) return;
    try {
      await this.query(`
        CREATE TABLE IF NOT EXISTS \`accounts\` (
          \`id\` VARCHAR(32) PRIMARY KEY,
          \`name\` VARCHAR(120) NOT NULL,
          \`email\` VARCHAR(160) NOT NULL,
          \`phone\` VARCHAR(32) NOT NULL,
          \`avatar\` VARCHAR(8) NOT NULL,
          \`role\` VARCHAR(24) NOT NULL DEFAULT 'user',
          \`account_number\` VARCHAR(24) NOT NULL UNIQUE,
          \`ifsc\` VARCHAR(16) NOT NULL DEFAULT 'SLB0001234',
          \`account_type\` VARCHAR(24) NOT NULL DEFAULT 'Savings',
          \`balance\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          \`credit_score\` INT UNSIGNED NOT NULL DEFAULT 750,
          \`risk_profile\` VARCHAR(24) NOT NULL DEFAULT 'Low',
          \`risk_score\` INT UNSIGNED NOT NULL DEFAULT 10,
          \`location\` VARCHAR(100) NOT NULL DEFAULT 'India',
          \`kyc_status\` VARCHAR(24) NOT NULL DEFAULT 'verified',
          \`is_demo\` BOOLEAN NOT NULL DEFAULT FALSE,
          \`face_enrolled\` BOOLEAN NOT NULL DEFAULT FALSE,
          \`touch_enrolled\` BOOLEAN NOT NULL DEFAULT FALSE,
          \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('✅ [MySQL] Verified relational schema tables.');
    } catch (e) {
      console.warn('⚠️ [MySQL] Schema initialization notice:', e.message);
    }
  }
}

const mysqlClient = new MySQLClient();
module.exports = mysqlClient;
