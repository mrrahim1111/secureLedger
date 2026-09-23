-- ─────────────────────────────────────────────────────────────
-- SecureLedger Core Banking & Fraud Surveillance Database Schema
-- Compatible with MySQL 8.0+ / MariaDB 10.5+
-- ─────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS `secureledger` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `secureledger`;

-- 1. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(160) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `avatar` VARCHAR(8) NOT NULL,
  `role` VARCHAR(24) NOT NULL DEFAULT 'user',
  `account_number` VARCHAR(24) NOT NULL UNIQUE,
  `ifsc` VARCHAR(16) NOT NULL DEFAULT 'SLB0001234',
  `account_type` ENUM('Savings', 'Current', 'Salary', 'Corporate') NOT NULL DEFAULT 'Savings',
  `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `credit_score` INT UNSIGNED NOT NULL DEFAULT 750,
  `risk_profile` ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Low',
  `risk_score` INT UNSIGNED NOT NULL DEFAULT 10,
  `location` VARCHAR(100) NOT NULL DEFAULT 'India',
  `kyc_status` ENUM('verified', 'pending', 'rejected') NOT NULL DEFAULT 'verified',
  `is_demo` BOOLEAN NOT NULL DEFAULT FALSE,
  `face_enrolled` BOOLEAN NOT NULL DEFAULT FALSE,
  `touch_enrolled` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_acc_number` (`account_number`),
  INDEX `idx_acc_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CARDS TABLE
CREATE TABLE IF NOT EXISTS `cards` (
  `id` VARCHAR(32) NOT NULL,
  `account_id` VARCHAR(32) NOT NULL,
  `card_number` VARCHAR(24) NOT NULL UNIQUE,
  `card_holder` VARCHAR(120) NOT NULL,
  `expiry` VARCHAR(8) NOT NULL,
  `cvv` VARCHAR(4) NOT NULL,
  `card_type` ENUM('Visa Platinum', 'Mastercard World', 'RuPay Select') NOT NULL DEFAULT 'Visa Platinum',
  `card_limit` DECIMAL(12, 2) NOT NULL DEFAULT 200000.00,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(32) NOT NULL,
  `date` DATE NOT NULL,
  `time` VARCHAR(16) NOT NULL,
  `sender_id` VARCHAR(32) NOT NULL,
  `sender_name` VARCHAR(120) NOT NULL,
  `sender_acc` VARCHAR(24) NOT NULL,
  `receiver_id` VARCHAR(32) NOT NULL,
  `receiver_name` VARCHAR(120) NOT NULL,
  `receiver_acc` VARCHAR(24) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `type` ENUM('Debit', 'Credit') NOT NULL,
  `category` VARCHAR(64) NOT NULL DEFAULT 'Transfer',
  `risk` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low',
  `risk_score` INT UNSIGNED NOT NULL DEFAULT 5,
  `status` ENUM('Completed', 'Review', 'Blocked', 'Pending') NOT NULL DEFAULT 'Completed',
  `location` VARCHAR(100) NOT NULL DEFAULT 'India',
  `device` VARCHAR(80) NOT NULL DEFAULT 'Mobile Device',
  `method` VARCHAR(48) NOT NULL DEFAULT 'UPI Instant',
  `note` VARCHAR(255) NULL,
  `reasons` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_txn_sender` (`sender_acc`),
  INDEX `idx_txn_receiver` (`receiver_acc`),
  INDEX `idx_txn_date` (`date`),
  INDEX `idx_txn_risk` (`risk`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. DOUBLE-ENTRY JOURNAL ENTRIES
CREATE TABLE IF NOT EXISTS `journal_entries` (
  `id` VARCHAR(36) NOT NULL,
  `txn_id` VARCHAR(32) NOT NULL,
  `account_number` VARCHAR(24) NOT NULL,
  `entry_type` ENUM('DEBIT', 'CREDIT') NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `entry_date` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_je_txn` (`txn_id`),
  INDEX `idx_je_acc` (`account_number`),
  FOREIGN KEY (`txn_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. FRAUD ALERTS TABLE
CREATE TABLE IF NOT EXISTS `fraud_alerts` (
  `id` VARCHAR(32) NOT NULL,
  `txn_id` VARCHAR(32) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `risk_score` INT UNSIGNED NOT NULL,
  `risk_level` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'high',
  `sender` VARCHAR(120) NOT NULL,
  `receiver` VARCHAR(120) NOT NULL,
  `timestamp` VARCHAR(32) NOT NULL,
  `status` ENUM('Under Review', 'Confirmed Fraud', 'False Positive', 'Resolved') NOT NULL DEFAULT 'Under Review',
  `reasons` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_alert_txn` (`txn_id`),
  FOREIGN KEY (`txn_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BENEFICIARIES TABLE
CREATE TABLE IF NOT EXISTS `beneficiaries` (
  `id` VARCHAR(32) NOT NULL,
  `account_id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `account_number` VARCHAR(24) NOT NULL,
  `ifsc` VARCHAR(16) NOT NULL,
  `bank_name` VARCHAR(100) NOT NULL,
  `nickname` VARCHAR(60) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ben_account` (`account_id`),
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- SEED DATA: REALISTIC CORE BANKING INITIAL STATE
-- ─────────────────────────────────────────────────────────────

-- Demo Accounts (Protected)
INSERT INTO `accounts` (`id`, `name`, `email`, `phone`, `avatar`, `role`, `account_number`, `ifsc`, `account_type`, `balance`, `credit_score`, `risk_profile`, `risk_score`, `location`, `kyc_status`, `is_demo`, `face_enrolled`, `touch_enrolled`)
VALUES
('USR001', 'Rahim', 'rahim@secureledger.dev', '+91 98765 43210', 'R', 'user', 'SLAC000001', 'SLB0001234', 'Savings', 48350.00, 785, 'Low', 12, 'Kakinada, AP', 'verified', TRUE, TRUE, TRUE),
('USR002', 'Arjun Sharma', 'arjun.sharma@secureledger.dev', '+91 98111 22334', 'AS', 'user', 'SLAC000002', 'SLB0001234', 'Savings', 34200.00, 792, 'Low', 10, 'Hyderabad, TS', 'verified', TRUE, FALSE, TRUE),
('USR003', 'Priya Nair', 'priya.nair@example.com', '+91 97222 33445', 'PN', 'user', 'SLAC000003', 'SLB0001234', 'Savings', 62400.00, 804, 'Low', 8, 'Bangalore, KA', 'verified', FALSE, FALSE, FALSE),
('USR004', 'Aman Verma', 'aman.v@example.com', '+91 96333 44556', 'AV', 'user', 'SLAC000004', 'SLB0001234', 'Current', 14500.00, 680, 'Medium', 54, 'Delhi, DL', 'verified', FALSE, FALSE, FALSE),
('USR005', 'Neha Patel', 'neha.p@example.com', '+91 95444 55667', 'NP', 'user', 'SLAC000005', 'SLB0001234', 'Savings', 41800.00, 765, 'Low', 16, 'Mumbai, MH', 'verified', FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Associated Cards
INSERT INTO `cards` (`id`, `account_id`, `card_number`, `card_holder`, `expiry`, `cvv`, `card_type`, `card_limit`, `is_active`)
VALUES
('CARD001', 'USR001', '4532 •••• •••• 8921', 'RAHIM', '08/29', '742', 'Visa Platinum', 250000.00, TRUE),
('CARD002', 'USR002', '5241 •••• •••• 3145', 'ARJUN SHARMA', '11/30', '391', 'Mastercard World', 200000.00, TRUE)
ON DUPLICATE KEY UPDATE `card_holder`=VALUES(`card_holder`);
