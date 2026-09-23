// ─────────────────────────────────────────────────────────────
// SecureLedger — Core Double-Entry Banking Ledger Layer
// Atomic Balance Consistency, Journal Invariants & File Persistence
// ─────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const fraudEngine = require('./fraud-engine');

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'ledger-store.json');

class LedgerDatabase {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.warn('Could not create data dir:', e);
      }
    }

    // Default Seed Data
    this.currentUser = {
      id: 'USR001',
      name: 'Rahim',
      email: 'rahim@securledger.dev',
      phone: '+91 98765 43210',
      avatar: 'R',
      role: 'user',
      joinDate: '2024-01-15',
      location: 'Kakinada, AP',
      kycStatus: 'verified',
      accountNumber: 'SLAC000001',
      ifsc: 'SLB0001234',
      balance: 48350,
      creditScore: 785,
      riskProfile: 'Low',
      biometricsEnrolled: true,
      faceEnrolled: true,
      touchEnrolled: true
    };

    this.users = [
      { id: 'USR001', name: 'Rahim', avatar: 'R', accountId: 'SLAC000001', balance: 48350, risk: 'low', riskScore: 12, location: 'Kakinada', txnCount: 28, totalAmount: 182500, avgTxn: 1450 },
      { id: 'USR002', name: 'Arjun Sharma', avatar: 'AS', accountId: 'SLAC000002', balance: 34200, risk: 'low', riskScore: 10, location: 'Hyderabad', txnCount: 22, totalAmount: 114600, avgTxn: 1200 },
      { id: 'USR003', name: 'Priya Nair', avatar: 'PN', accountId: 'SLAC000003', balance: 62400, risk: 'low', riskScore: 8, location: 'Bangalore', txnCount: 35, totalAmount: 248000, avgTxn: 2100 },
      { id: 'USR004', name: 'Aman Verma', avatar: 'AV', accountId: 'SLAC000004', balance: 14500, risk: 'medium', riskScore: 54, location: 'Delhi', txnCount: 48, totalAmount: 135000, avgTxn: 950 },
      { id: 'USR005', name: 'Neha Patel', avatar: 'NP', accountId: 'SLAC000005', balance: 41800, risk: 'low', riskScore: 16, location: 'Mumbai', txnCount: 19, totalAmount: 198000, avgTxn: 3200 },
      { id: 'USR006', name: 'Swiggy India', avatar: 'SW', accountId: 'SLAC000006', balance: 4280000, risk: 'low', riskScore: 5, location: 'Bangalore', txnCount: 2840, totalAmount: 42000000, avgTxn: 450 },
      { id: 'USR007', name: 'Amazon India Pay', avatar: 'AZ', accountId: 'SLAC000007', balance: 9850000, risk: 'low', riskScore: 6, location: 'Hyderabad', txnCount: 4910, totalAmount: 84000000, avgTxn: 1800 },
      { id: 'USR008', name: 'Zomato DineOut', avatar: 'ZO', accountId: 'SLAC000008', balance: 2140000, risk: 'low', riskScore: 5, location: 'Gurgaon', txnCount: 1980, totalAmount: 29000000, avgTxn: 620 },
      { id: 'USR009', name: 'Netflix India', avatar: 'NF', accountId: 'SLAC000009', balance: 3400000, risk: 'low', riskScore: 4, location: 'Mumbai', txnCount: 3200, totalAmount: 2076800, avgTxn: 649 },
      { id: 'USR010', name: 'Uber Rides', avatar: 'UB', accountId: 'SLAC000010', balance: 1850000, risk: 'low', riskScore: 5, location: 'Hyderabad', txnCount: 1640, totalAmount: 623200, avgTxn: 380 },
      { id: 'USR011', name: 'APSPDCL Electricity Board', avatar: 'EB', accountId: 'SLAC000011', balance: 14500000, risk: 'low', riskScore: 2, location: 'Vijayawada', txnCount: 12400, totalAmount: 30380000, avgTxn: 2450 },
      { id: 'USR012', name: 'Starbucks Coffee', avatar: 'SB', accountId: 'SLAC000012', balance: 890000, risk: 'low', riskScore: 4, location: 'Hyderabad', txnCount: 890, totalAmount: 400500, avgTxn: 450 },
      { id: 'USR013', name: 'TechCorp Solutions Payroll', avatar: 'TC', accountId: 'SLAC000013', balance: 85400000, risk: 'low', riskScore: 2, location: 'Hyderabad', txnCount: 8400, totalAmount: 714000000, avgTxn: 85000 },
      { id: 'USR014', name: 'Unknown Offshore Wallet', avatar: '?', accountId: 'SLAC000098', balance: 0, risk: 'high', riskScore: 95, location: 'Unknown - VPN', txnCount: 8, totalAmount: 650000, avgTxn: 81250 },
      { id: 'USR015', name: 'Suspicious Crypto P2P Desk', avatar: '!', accountId: 'SLAC000099', balance: 1500, risk: 'high', riskScore: 98, location: 'Multiple/Tor Exit', txnCount: 114, totalAmount: 4800000, avgTxn: 42100 }
    ];

    this.transactions = [
      { id: 'TXN1001', date: '2026-09-23', time: '11:45 AM', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Starbucks Coffee', receiverAcc: 'SLAC000012', amount: 450, type: 'Debit', category: 'Food & Dining', risk: 'low', riskScore: 6, status: 'Completed', location: 'Kakinada', device: 'iPhone 15 Pro', method: 'UPI Instant (GPay)', note: 'Iced Latte & Croissant' },
      { id: 'TXN1002', date: '2026-09-23', time: '08:00 AM', sender: 'TechCorp Solutions Payroll', senderAcc: 'SLAC000013', receiver: 'Rahim', receiverAcc: 'SLAC000001', amount: 85000, type: 'Credit', category: 'Salary', risk: 'low', riskScore: 3, status: 'Completed', location: 'Hyderabad', device: 'Corporate Core System', method: 'NEFT Automated', note: 'Monthly Salary - Sept 2026' },
      { id: 'TXN1003', date: '2026-09-23', time: '02:31 AM', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Unknown Offshore Wallet', receiverAcc: 'SLAC000098', amount: 75000, type: 'Debit', category: 'Transfer', risk: 'high', riskScore: 95, status: 'Review', location: 'Unknown - VPN Node', device: 'Unknown Device', method: 'IMPS Instant', note: 'Offshore Crypto Investment', reasons: ['Amount 52× higher than user 30-day baseline (₹1,450)', 'First-time transfer to flagged mule wallet', 'Initiated at 2:31 AM anomalous hour', 'Anonymizing VPN/Proxy routing detected'] },
      { id: 'TXN1004', date: '2026-09-22', time: '08:42 PM', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Swiggy India', receiverAcc: 'SLAC000006', amount: 620, type: 'Debit', category: 'Food & Dining', risk: 'low', riskScore: 8, status: 'Completed', location: 'Kakinada', device: 'iPhone 15 Pro', method: 'UPI Instant', note: 'Biryani Family Pack' },
      { id: 'TXN1005', date: '2026-09-22', time: '01:15 PM', sender: 'Priya Nair', senderAcc: 'SLAC000003', receiver: 'Rahim', receiverAcc: 'SLAC000001', amount: 8500, type: 'Credit', category: 'Transfer', risk: 'low', riskScore: 5, status: 'Completed', location: 'Bangalore', device: 'Samsung Galaxy S24', method: 'UPI Instant', note: 'Apartment Maintenance & Wi-Fi Split' },
      { id: 'TXN1006', date: '2026-09-22', time: '10:00 AM', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Netflix India', receiverAcc: 'SLAC000009', amount: 649, type: 'Debit', category: 'Subscription', risk: 'low', riskScore: 4, status: 'Completed', location: 'Kakinada', device: 'Apple Auto-Debit', method: 'e-Mandate / UPI Autopay', note: 'Netflix Premium 4K Monthly' },
      { id: 'TXN1007', date: '2026-09-21', time: '06:30 PM', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Amazon India Pay', receiverAcc: 'SLAC000007', amount: 1899, type: 'Debit', category: 'Shopping', risk: 'low', riskScore: 9, status: 'Completed', location: 'Kakinada', device: 'iPhone 15 Pro', method: 'Net Banking', note: 'Ergonomic Laptop Stand & Braided Cable' },
      { id: 'TXN1008', date: '2026-09-21', time: '02:15 PM', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Uber Rides', receiverAcc: 'SLAC000010', amount: 380, type: 'Debit', category: 'Travel', risk: 'low', riskScore: 7, status: 'Completed', location: 'Hyderabad', device: 'iPhone 15 Pro', method: 'UPI Instant', note: 'Uber Premier - Airport to Madhapur' },
      { id: 'TXN1009', date: '2026-09-20', time: '11:15 PM', sender: 'Aman Verma', senderAcc: 'SLAC000004', receiver: 'Suspicious Crypto P2P Desk', receiverAcc: 'SLAC000099', amount: 42000, type: 'Debit', category: 'Transfer', risk: 'high', riskScore: 89, status: 'Review', location: 'Delhi - VPN', device: 'Rooted Android Device', method: 'IMPS Instant', note: 'P2P Exchange USDT', reasons: ['Recipient flagged in fraud intelligence registry', 'Rooted hardware environment detected', 'High volume night transaction'] },
      { id: 'TXN1010', date: '2026-09-20', time: '04:10 PM', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'APSPDCL Electricity Board', receiverAcc: 'SLAC000011', amount: 2450, type: 'Debit', category: 'Utilities', risk: 'low', riskScore: 3, status: 'Completed', location: 'Kakinada', device: 'MacBook Pro', method: 'BBPS Bharat BillPay', note: 'Home Electricity Bill - Consumer #41029' },
      { id: 'TXN1011', date: '2026-09-19', time: '09:45 PM', sender: 'Suspicious Crypto P2P Desk', senderAcc: 'SLAC000099', receiver: 'Unknown Offshore Wallet', receiverAcc: 'SLAC000098', amount: 125000, type: 'Debit', category: 'Transfer', risk: 'high', riskScore: 98, status: 'Blocked', location: 'Multiple Tor Nodes', device: 'Virtual Machine / Emulator', method: 'IMPS Instant', note: 'Rapid Mule Laundering', reasons: ['Layered money muling pattern identified', 'Multiple Tor exit nodes in sequence', 'Daily limit velocity exceeded'] },
      { id: 'TXN1012', date: '2026-09-19', time: '01:30 PM', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Zomato DineOut', receiverAcc: 'SLAC000008', amount: 1780, type: 'Debit', category: 'Food & Dining', risk: 'low', riskScore: 7, status: 'Completed', location: 'Kakinada', device: 'iPhone 15 Pro', method: 'UPI Instant', note: 'Weekend Family Lunch' },
      { id: 'TXN1013', date: '2026-09-18', time: '05:20 PM', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Arjun Sharma', receiverAcc: 'SLAC000002', amount: 320, type: 'Debit', category: 'Transfer', risk: 'low', riskScore: 5, status: 'Completed', location: 'Kakinada', device: 'iPhone 15 Pro', method: 'UPI Instant', note: 'Coffee & Snacks split' }
    ];

    this.journalEntries = [];
    this.transactions.forEach(t => {
      this.journalEntries.push(
        { id: `JE-${t.id}-1`, txnId: t.id, account: t.senderAcc, type: 'DEBIT', amount: t.amount, date: t.date },
        { id: `JE-${t.id}-2`, txnId: t.id, account: t.receiverAcc, type: 'CREDIT', amount: t.amount, date: t.date }
      );
    });

    this.alerts = [
      { id: 'ALT001', txnId: 'TXN1003', amount: 75000, riskScore: 95, riskLevel: 'high', sender: 'Rahim', receiver: 'Unknown Offshore Wallet', timestamp: '2026-09-23 02:31 AM', status: 'Under Review', reasons: ['Transaction amount 52× higher than average (₹1,450)', 'First-time transfer to flagged mule wallet', 'Transaction at 2:31 AM unusual hour', 'Anonymizing VPN/Proxy routing detected', 'Device fingerprint mismatch'] },
      { id: 'ALT002', txnId: 'TXN1009', amount: 42000, riskScore: 89, riskLevel: 'high', sender: 'Aman Verma', receiver: 'Suspicious Crypto P2P Desk', timestamp: '2026-09-20 11:15 PM', status: 'Under Review', reasons: ['Recipient flagged in financial cybercrime intelligence', 'Transaction initiated at 11:15 PM', 'Amount significantly higher than historical mean', 'Rooted Android environment detected'] },
      { id: 'ALT003', txnId: 'TXN1011', amount: 125000, riskScore: 98, riskLevel: 'high', sender: 'Suspicious Crypto P2P Desk', receiver: 'Unknown Offshore Wallet', timestamp: '2026-09-19 09:45 PM', status: 'Confirmed Fraud', reasons: ['Account confirmed in synthetic money mule ring', 'Virtual machine / Tor proxy network detected', 'Velocity limit exceeded with rapid structuring'] }
    ];

    this.networkNodes = [
      { id: 'n1', label: 'Rahim', risk: 'low', x: 0, y: 0, z: 0 },
      { id: 'n2', label: 'Arjun Sharma', risk: 'low', x: 3, y: 1, z: -1 },
      { id: 'n3', label: 'Priya Nair', risk: 'low', x: -3, y: 1, z: 1 },
      { id: 'n4', label: 'Aman Verma', risk: 'medium', x: 1, y: -2, z: 2 },
      { id: 'n5', label: 'Neha Patel', risk: 'low', x: -1, y: 2, z: -2 },
      { id: 'n6', label: 'Swiggy India', risk: 'low', x: 4, y: -1, z: -2 },
      { id: 'n7', label: 'Amazon Pay', risk: 'low', x: -4, y: -1, z: 2 },
      { id: 'n8', label: 'Starbucks', risk: 'low', x: 2, y: -3, z: 1 },
      { id: 'n9', label: 'Netflix India', risk: 'low', x: -2, y: 3, z: -1 },
      { id: 'n10', label: 'TechCorp Payroll', risk: 'low', x: 0, y: -3, z: 0 },
      { id: 'n11', label: 'Offshore Mule', risk: 'high', x: 2, y: 3, z: 3 },
      { id: 'n12', label: 'Crypto P2P', risk: 'high', x: -2, y: -3, z: -3 }
    ];

    this.networkEdges = [
      { from: 'n10', to: 'n1', amount: 85000, risk: 'low', id: 'TXN1002' },
      { from: 'n1', to: 'n8', amount: 450, risk: 'low', id: 'TXN1001' },
      { from: 'n1', to: 'n11', amount: 75000, risk: 'high', id: 'TXN1003' },
      { from: 'n1', to: 'n6', amount: 620, risk: 'low', id: 'TXN1004' },
      { from: 'n3', to: 'n1', amount: 8500, risk: 'low', id: 'TXN1005' },
      { from: 'n1', to: 'n9', amount: 649, risk: 'low', id: 'TXN1006' },
      { from: 'n1', to: 'n7', amount: 1899, risk: 'low', id: 'TXN1007' },
      { from: 'n4', to: 'n12', amount: 42000, risk: 'high', id: 'TXN1009' },
      { from: 'n12', to: 'n11', amount: 125000, risk: 'high', id: 'TXN1011' },
      { from: 'n1', to: 'n2', amount: 320, risk: 'low', id: 'TXN1013' }
    ];

    this._saveToDisk();
  }

  _saveToDisk() {
    try {
      const data = {
        currentUser: this.currentUser,
        users: this.users,
        transactions: this.transactions,
        journalEntries: this.journalEntries,
        alerts: this.alerts,
        networkNodes: this.networkNodes,
        networkEdges: this.networkEdges,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.warn('Could not save to disk:', err);
    }
  }

  // ── LEDGER OPERATIONS ─────────────────────────────────────

  /**
   * Processes a transaction atomically with double-entry ledger entries
   */
  processTransaction(payload) {
    const { receiverName, amount, description = '', device = 'iPhone 15 Pro', location = 'Kakinada' } = payload;
    const numAmount = parseInt(amount, 10);

    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid transaction amount');
    }

    if (numAmount > this.currentUser.balance) {
      throw new Error('Insufficient account balance');
    }

    const receiver = this.users.find(u => u.name === receiverName) || {
      id: 'USR' + Math.floor(100 + Math.random() * 900),
      name: receiverName,
      accountId: 'SLAC' + Math.floor(100000 + Math.random() * 900000)
    };

    // Run AI Risk Engine
    const riskEval = fraudEngine.evaluateTransaction({
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      receiverId: receiver.id,
      receiverName: receiver.name,
      amount: numAmount,
      device,
      location
    });

    const txnId = 'TXN' + (1000 + this.transactions.length + 1);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const isHighRisk = riskEval.level === 'high';
    const status = isHighRisk ? 'Review' : 'Completed';

    // 1. Create Transaction Record
    const newTxn = {
      id: txnId,
      date: dateStr,
      time: timeStr,
      sender: this.currentUser.name,
      senderAcc: this.currentUser.accountNumber,
      receiver: receiver.name,
      receiverAcc: receiver.accountId,
      amount: numAmount,
      type: 'Debit',
      category: 'Transfer',
      risk: riskEval.level,
      riskScore: riskEval.score,
      status: status,
      location: location,
      device: device,
      method: 'UPI Instant (GPay)',
      note: description,
      reasons: riskEval.reasons
    };

    this.transactions.unshift(newTxn);

    // 2. Atomic Double-Entry Ledger Bookkeeping
    if (!isHighRisk) {
      this.currentUser.balance -= numAmount;
      const targetUser = this.users.find(u => u.name === receiver.name);
      if (targetUser) targetUser.balance += numAmount;

      this.journalEntries.push(
        { id: `JE-${txnId}-1`, txnId: txnId, account: this.currentUser.accountNumber, type: 'DEBIT', amount: numAmount, date: dateStr },
        { id: `JE-${txnId}-2`, txnId: txnId, account: receiver.accountId, type: 'CREDIT', amount: numAmount, date: dateStr }
      );
    } else {
      // Create Fraud Alert
      this.alerts.unshift({
        id: 'ALT00' + (this.alerts.length + 1),
        txnId: txnId,
        amount: numAmount,
        riskScore: riskEval.score,
        riskLevel: riskEval.level,
        sender: this.currentUser.name,
        receiver: receiver.name,
        timestamp: `${dateStr} ${timeStr}`,
        status: 'Under Review',
        reasons: riskEval.reasons
      });
    }

    this._saveToDisk();

    return {
      transaction: newTxn,
      risk: riskEval,
      newBalance: this.currentUser.balance
    };
  }

  getTransactions(filters = {}) {
    let list = [...this.transactions];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.sender.toLowerCase().includes(q) ||
        t.receiver.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    if (filters.risk) {
      list = list.filter(t => t.risk === filters.risk);
    }
    if (filters.type) {
      list = list.filter(t => t.type === filters.type);
    }
    if (filters.status) {
      list = list.filter(t => t.status === filters.status);
    }
    return list;
  }

  getTransactionById(id) {
    return this.transactions.find(t => t.id === id);
  }

  getAlerts() {
    return this.alerts;
  }

  updateAlertAction(alertId, action) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');

    if (action === 'normal') alert.status = 'False Positive';
    else if (action === 'fraud') alert.status = 'Confirmed Fraud';
    else if (action === 'block') alert.status = 'Blocked';

    this._saveToDisk();
    return alert;
  }

  getAnalytics() {
    const credits = this.transactions.filter(t => t.type === 'Credit').reduce((acc, t) => acc + t.amount, 0);
    const debits = this.transactions.filter(t => t.type === 'Debit' && t.status === 'Completed').reduce((acc, t) => acc + t.amount, 0);

    return {
      monthlyData: {
        labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        credits: [85000, 85000, 93500, 85000, 85000, credits || 93500],
        debits: [32000, 28500, 39000, 31000, 34200, debits || 45150],
        suspicious: [1, 2, 1, 4, 2, this.alerts.length],
        normal: [148, 162, 142, 194, 176, 188]
      },
      categoryData: {
        labels: ['Food & Dining', 'Shopping', 'Salary & Income', 'Utilities', 'Subscriptions', 'Peer Transfers', 'Travel'],
        amounts: [3850, 12899, 93500, 2450, 649, 18820, 1380]
      },
      riskDistribution: {
        low: this.transactions.filter(t => t.risk === 'low').length,
        medium: this.transactions.filter(t => t.risk === 'medium').length,
        high: this.transactions.filter(t => t.risk === 'high').length
      },
      totalBalance: this.currentUser.balance
    };
  }

  getNetworkGraph() {
    return {
      nodes: this.networkNodes,
      edges: this.networkEdges
    };
  }
}

module.exports = new LedgerDatabase();
