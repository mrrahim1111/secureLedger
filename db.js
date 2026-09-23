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

    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        const data = JSON.parse(raw);
        this.currentUser = data.currentUser;
        this.users = data.users;
        this.transactions = data.transactions;
        this.journalEntries = data.journalEntries;
        this.alerts = data.alerts;
        this.networkNodes = data.networkNodes;
        this.networkEdges = data.networkEdges;
        console.log('📦 Persistent Ledger loaded successfully from disk');
        return;
      } catch (err) {
        console.warn('Could not load persistent store, falling back to defaults:', err);
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
      balance: 25430,
      creditScore: 742,
      riskProfile: 'Low',
      biometricsEnrolled: true,
      faceEnrolled: true,
      touchEnrolled: true
    };

    this.users = [
      { id: 'USR001', name: 'Rahim', avatar: 'R', accountId: 'SLAC000001', balance: 25430, risk: 'low', riskScore: 18, location: 'Kakinada', txnCount: 24, totalAmount: 142500, avgTxn: 1500 },
      { id: 'USR002', name: 'Arjun', avatar: 'A', accountId: 'SLAC000002', balance: 18200, risk: 'low', riskScore: 12, location: 'Hyderabad', txnCount: 18, totalAmount: 87600, avgTxn: 1200 },
      { id: 'USR003', name: 'Priya', avatar: 'P', accountId: 'SLAC000003', balance: 45600, risk: 'low', riskScore: 9, location: 'Bangalore', txnCount: 31, totalAmount: 218000, avgTxn: 2100 },
      { id: 'USR004', name: 'Aman', avatar: 'AM', accountId: 'SLAC000004', balance: 8900, risk: 'medium', riskScore: 54, location: 'Delhi', txnCount: 42, totalAmount: 95000, avgTxn: 800 },
      { id: 'USR005', name: 'Neha', avatar: 'N', accountId: 'SLAC000005', balance: 32100, risk: 'low', riskScore: 22, location: 'Mumbai', txnCount: 15, totalAmount: 176000, avgTxn: 3200 },
      { id: 'USR006', name: 'Merchant A', avatar: 'MA', accountId: 'SLAC000006', balance: 124000, risk: 'low', riskScore: 14, location: 'Chennai', txnCount: 198, totalAmount: 1420000, avgTxn: 850 },
      { id: 'USR007', name: 'Merchant B', avatar: 'MB', accountId: 'SLAC000007', balance: 87500, risk: 'medium', riskScore: 47, location: 'Pune', txnCount: 142, totalAmount: 980000, avgTxn: 1200 },
      { id: 'USR008', name: 'Unknown Account', avatar: '?', accountId: 'SLAC000008', balance: 0, risk: 'high', riskScore: 91, location: 'Unknown', txnCount: 6, totalAmount: 450000, avgTxn: 75000 },
      { id: 'USR009', name: 'High-Risk Account', avatar: '!', accountId: 'SLAC000009', balance: 1200, risk: 'high', riskScore: 94, location: 'Multiple', txnCount: 89, totalAmount: 2100000, avgTxn: 25000 },
      { id: 'USR010', name: 'Company Payroll', avatar: 'CP', accountId: 'SLAC000010', balance: 5420000, risk: 'low', riskScore: 5, location: 'Hyderabad', txnCount: 1240, totalAmount: 18500000, avgTxn: 28000 }
    ];

    this.transactions = [
      { id: 'TXN1001', date: '2026-09-23', time: '09:14', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Arjun', receiverAcc: 'SLAC000002', amount: 500, type: 'Debit', category: 'Transfer', risk: 'low', riskScore: 8, status: 'Completed', location: 'Kakinada', device: 'iPhone 15 Pro', method: 'UPI Sim', note: 'Coffee money' },
      { id: 'TXN1002', date: '2026-09-23', time: '08:00', sender: 'Company Payroll', senderAcc: 'SLAC000010', receiver: 'Rahim', receiverAcc: 'SLAC000001', amount: 30000, type: 'Credit', category: 'Salary', risk: 'low', riskScore: 4, status: 'Completed', location: 'Hyderabad', device: 'System', method: 'NEFT Sim', note: 'Monthly salary' },
      { id: 'TXN1003', date: '2026-09-23', time: '02:31', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Unknown Account', receiverAcc: 'SLAC000008', amount: 75000, type: 'Debit', category: 'Transfer', risk: 'high', riskScore: 91, status: 'Review', location: 'Unknown - VPN', device: 'Unknown Device', method: 'IMPS Sim', note: 'Investment' },
      { id: 'TXN1004', date: '2026-09-22', time: '19:42', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Merchant A', receiverAcc: 'SLAC000006', amount: 1200, type: 'Debit', category: 'Shopping', risk: 'low', riskScore: 11, status: 'Completed', location: 'Kakinada', device: 'iPhone 15 Pro', method: 'UPI Sim', note: 'Grocery shopping' },
      { id: 'TXN1005', date: '2026-09-22', time: '13:20', sender: 'Priya', senderAcc: 'SLAC000003', receiver: 'Rahim', receiverAcc: 'SLAC000001', amount: 3500, type: 'Credit', category: 'Transfer', risk: 'low', riskScore: 7, status: 'Completed', location: 'Bangalore', device: 'Samsung Galaxy S24', method: 'UPI Sim', note: 'Rent split' },
      { id: 'TXN1006', date: '2026-09-22', time: '11:05', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Merchant B', receiverAcc: 'SLAC000007', amount: 850, type: 'Debit', category: 'Food', risk: 'low', riskScore: 6, status: 'Completed', location: 'Kakinada', device: 'iPhone 15 Pro', method: 'UPI Sim', note: 'Restaurant' },
      { id: 'TXN1007', date: '2026-09-21', time: '16:30', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Arjun', receiverAcc: 'SLAC000002', amount: 2000, type: 'Debit', category: 'Transfer', risk: 'low', riskScore: 10, status: 'Completed', location: 'Kakinada', device: 'iPhone 15 Pro', method: 'UPI Sim', note: 'Movie tickets' },
      { id: 'TXN1008', date: '2026-09-21', time: '10:00', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Merchant A', receiverAcc: 'SLAC000006', amount: 4500, type: 'Debit', category: 'Bills', risk: 'low', riskScore: 9, status: 'Completed', location: 'Kakinada', device: 'iPhone 15 Pro', method: 'Net Banking Sim', note: 'Electricity bill' },
      { id: 'TXN1009', date: '2026-09-20', time: '23:15', sender: 'Aman', senderAcc: 'SLAC000004', receiver: 'High-Risk Account', receiverAcc: 'SLAC000009', amount: 42000, type: 'Debit', category: 'Transfer', risk: 'high', riskScore: 87, status: 'Review', location: 'Delhi - VPN', device: 'Unknown Device', method: 'IMPS Sim', note: 'Business' },
      { id: 'TXN1010', date: '2026-09-20', time: '14:22', sender: 'Neha', senderAcc: 'SLAC000005', receiver: 'Merchant A', receiverAcc: 'SLAC000006', amount: 6700, type: 'Debit', category: 'Shopping', risk: 'low', riskScore: 13, status: 'Completed', location: 'Mumbai', device: 'MacBook Pro', method: 'Net Banking Sim', note: 'Electronics' },
      { id: 'TXN1011', date: '2026-09-20', time: '09:30', sender: 'Company Payroll', senderAcc: 'SLAC000010', receiver: 'Arjun', receiverAcc: 'SLAC000002', amount: 28000, type: 'Credit', category: 'Salary', risk: 'low', riskScore: 3, status: 'Completed', location: 'Hyderabad', device: 'System', method: 'NEFT Sim', note: 'Monthly salary' },
      { id: 'TXN1012', date: '2026-09-19', time: '21:45', sender: 'High-Risk Account', senderAcc: 'SLAC000009', receiver: 'Unknown Account', receiverAcc: 'SLAC000008', amount: 125000, type: 'Debit', category: 'Transfer', risk: 'high', riskScore: 97, status: 'Blocked', location: 'Multiple', device: 'Rooted Android', method: 'IMPS Sim', note: '' }
    ];

    this.journalEntries = [];
    this.transactions.forEach(t => {
      this.journalEntries.push(
        { id: `JE-${t.id}-1`, txnId: t.id, account: t.senderAcc, type: 'DEBIT', amount: t.amount, date: t.date },
        { id: `JE-${t.id}-2`, txnId: t.id, account: t.receiverAcc, type: 'CREDIT', amount: t.amount, date: t.date }
      );
    });

    this.alerts = [
      { id: 'ALT001', txnId: 'TXN1003', amount: 75000, riskScore: 91, riskLevel: 'high', sender: 'Rahim', receiver: 'Unknown Account', timestamp: '2026-09-23 02:31 AM', status: 'Under Review', reasons: ['Transaction amount 50× higher than average (₹1,500)', 'New beneficiary - first-time transfer', 'Transaction at 2:31 AM (unusual time)', 'Transaction from unknown IP/VPN location', 'Device fingerprint mismatch'] },
      { id: 'ALT002', txnId: 'TXN1009', amount: 42000, riskScore: 87, riskLevel: 'high', sender: 'Aman', receiver: 'High-Risk Account', timestamp: '2026-09-20 11:15 PM', status: 'Under Review', reasons: ['Recipient account flagged as high-risk', 'Transaction at 11:15 PM', 'Amount significantly above average', 'VPN/Proxy detected during transaction'] },
      { id: 'ALT003', txnId: 'TXN1012', amount: 125000, riskScore: 97, riskLevel: 'high', sender: 'High-Risk Account', receiver: 'Unknown Account', timestamp: '2026-09-19 09:45 PM', status: 'Confirmed Fraud', reasons: ['Account flagged as high-risk', 'Transaction to flagged unknown account', 'Rooted device detected', 'Multiple rapid transactions', 'Amount exceeds daily limit pattern'] }
    ];

    this.networkNodes = [
      { id: 'n1', label: 'Rahim', risk: 'low', x: 0, y: 0, z: 0 },
      { id: 'n2', label: 'Arjun', risk: 'low', x: 3, y: 1, z: -1 },
      { id: 'n3', label: 'Priya', risk: 'low', x: -3, y: 1, z: 1 },
      { id: 'n4', label: 'Aman', risk: 'medium', x: 1, y: -2, z: 2 },
      { id: 'n5', label: 'Neha', risk: 'low', x: -1, y: 2, z: -2 },
      { id: 'n6', label: 'Merchant A', risk: 'low', x: 4, y: -1, z: -2 },
      { id: 'n7', label: 'Merchant B', risk: 'medium', x: -4, y: -1, z: 2 },
      { id: 'n8', label: 'Unknown Acct', risk: 'high', x: 2, y: 3, z: 3 },
      { id: 'n9', label: 'High-Risk', risk: 'high', x: -2, y: -3, z: -3 },
      { id: 'n10', label: 'Payroll Co.', risk: 'low', x: 0, y: -3, z: 0 }
    ];

    this.networkEdges = [
      { from: 'n1', to: 'n2', amount: 500, risk: 'low', id: 'TXN1001' },
      { from: 'n10', to: 'n1', amount: 30000, risk: 'low', id: 'TXN1002' },
      { from: 'n1', to: 'n8', amount: 75000, risk: 'high', id: 'TXN1003' },
      { from: 'n1', to: 'n6', amount: 1200, risk: 'low', id: 'TXN1004' },
      { from: 'n3', to: 'n1', amount: 3500, risk: 'low', id: 'TXN1005' },
      { from: 'n1', to: 'n7', amount: 850, risk: 'low', id: 'TXN1006' },
      { from: 'n4', to: 'n9', amount: 42000, risk: 'high', id: 'TXN1009' },
      { from: 'n5', to: 'n6', amount: 6700, risk: 'low', id: 'TXN1010' },
      { from: 'n10', to: 'n2', amount: 28000, risk: 'low', id: 'TXN1011' },
      { from: 'n9', to: 'n8', amount: 125000, risk: 'high', id: 'TXN1012' }
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
    const timeStr = now.toTimeString().slice(0, 5);

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
      method: 'UPI Instant',
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
        credits: [42000, 58000, 35000, 72000, 48000, credits || 42000],
        debits: [18000, 24000, 19000, 31000, 22000, debits || 18570],
        suspicious: [3, 5, 2, 8, 6, this.alerts.length],
        normal: [142, 158, 136, 187, 166, 182]
      },
      categoryData: {
        labels: ['Food', 'Shopping', 'Travel', 'Bills', 'Education', 'Transfers', 'Other'],
        amounts: [8400, 21200, 12600, 15800, 4500, 68000, 9200]
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
