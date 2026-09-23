// ─────────────────────────────────────────────────────────────
// SecureLedger — Core Double-Entry Banking Ledger Layer
// Atomic Balance Consistency, Journal Invariants & File Persistence
// ─────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const fraudEngine = require('./fraud-engine');
const mysqlClient = require('./mysql-client');

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

    // Connect to MySQL pool (auto-fallback if offline)
    mysqlClient.init().catch(err => console.warn('[MySQL] Init notice:', err.message));

    // Rate limiting map for UPI PIN attempts
    this.pinAttempts = new Map();
    const DEFAULT_PIN_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // sha256 of 123456

    // Default Demo & Realistic Accounts
    this.accounts = [
      {
        id: 'USR001',
        name: 'Rahim',
        email: 'rahim@secureledger.dev',
        phone: '+91 98765 43210',
        avatar: 'R',
        role: 'user',
        accountNumber: 'SLAC000001',
        ifsc: 'SLB0001234',
        accountType: 'Savings',
        balance: 48350,
        creditScore: 785,
        riskProfile: 'Low',
        riskScore: 12,
        location: 'Kakinada, AP',
        kycStatus: 'verified',
        isDemo: true,
        faceEnrolled: true,
        pinHash: DEFAULT_PIN_HASH,
        card: { number: '4532 •••• •••• 8921', holder: 'RAHIM', expiry: '08/29', type: 'Visa Platinum' },
        createdAt: '2024-01-15T00:00:00.000Z'
      },
      {
        id: 'USR002',
        name: 'Arjun Sharma',
        email: 'arjun.sharma@secureledger.dev',
        phone: '+91 98111 22334',
        avatar: 'AS',
        role: 'user',
        accountNumber: 'SLAC000002',
        ifsc: 'SLB0001234',
        accountType: 'Savings',
        balance: 34200,
        creditScore: 792,
        riskProfile: 'Low',
        riskScore: 10,
        location: 'Hyderabad, TS',
        kycStatus: 'verified',
        isDemo: true,
        faceEnrolled: false,
        pinHash: DEFAULT_PIN_HASH,
        card: { number: '5241 •••• •••• 3145', holder: 'ARJUN SHARMA', expiry: '11/30', type: 'Mastercard World' },
        createdAt: '2024-02-10T00:00:00.000Z'
      },
      {
        id: 'USR003',
        name: 'Priya Nair',
        email: 'priya.nair@example.com',
        phone: '+91 97222 33445',
        avatar: 'PN',
        role: 'user',
        accountNumber: 'SLAC000003',
        ifsc: 'SLB0001234',
        accountType: 'Savings',
        balance: 62400,
        creditScore: 804,
        riskProfile: 'Low',
        riskScore: 8,
        location: 'Bangalore, KA',
        kycStatus: 'verified',
        isDemo: false,
        faceEnrolled: false,
        pinHash: DEFAULT_PIN_HASH,
        card: { number: '4111 •••• •••• 5820', holder: 'PRIYA NAIR', expiry: '03/28', type: 'Visa Platinum' },
        createdAt: '2024-03-01T00:00:00.000Z'
      }
    ];

    // Default Seed Data
    this.currentUser = { ...this.accounts[0] };

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

    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.accounts && Array.isArray(parsed.accounts) && parsed.accounts.length) {
          this.accounts = parsed.accounts.map(acc => ({
            ...acc,
            pinHash: acc.pinHash || DEFAULT_PIN_HASH
          }));
        }
        if (parsed.currentUser) {
          this.currentUser = {
            ...parsed.currentUser,
            pinHash: parsed.currentUser.pinHash || DEFAULT_PIN_HASH
          };
        }
        if (parsed.users && parsed.users.length) this.users = parsed.users;
        if (parsed.transactions && parsed.transactions.length) this.transactions = parsed.transactions;
        if (parsed.journalEntries && parsed.journalEntries.length) this.journalEntries = parsed.journalEntries;
        if (parsed.alerts && parsed.alerts.length) this.alerts = parsed.alerts;
      } catch (e) {
        console.warn('Could not read existing store:', e.message);
      }
    }

    this._saveToDisk();
  }

  _saveToDisk() {
    try {
      const data = {
        accounts: this.accounts,
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
    const {
      receiverName,
      amount,
      description = '',
      device = 'iPhone 15 Pro',
      location = 'Kakinada',
      pinVerified = true,
      faceVerified = false,
      stepUpRequired = false
    } = payload;
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
    // If high-risk but face verification successfully completed, allow completion
    const status = (isHighRisk && !faceVerified) ? 'Review' : 'Completed';
    const methodStr = faceVerified ? 'UPI Instant (Face Verified Step-Up)' : 'UPI Instant';

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
      method: methodStr,
      note: description,
      reasons: riskEval.reasons,
      pinVerified: !!pinVerified,
      faceVerified: !!faceVerified,
      stepUpRequired: isHighRisk || stepUpRequired
    };

    // Build Detailed Security Audit Timeline
    const timeline = [
      {
        step: 1,
        title: 'Transaction Initiated',
        detail: `Transfer of ₹${numAmount.toLocaleString('en-IN')} to ${receiver.name}`,
        timestamp: `${dateStr} ${timeStr}`,
        status: 'success'
      },
      {
        step: 2,
        title: 'UPI PIN Verification',
        detail: pinVerified ? '6-digit UPI PIN cryptographically authorized' : 'PIN Authorized',
        timestamp: `${dateStr} ${timeStr}`,
        status: 'success'
      },
      {
        step: 3,
        title: 'AI Fraud Screening',
        detail: `AI Risk Score: ${riskEval.score}/100 (${riskEval.level.toUpperCase()} RISK) — ${riskEval.reasons.length} risk factor(s)`,
        timestamp: `${dateStr} ${timeStr}`,
        status: isHighRisk ? 'warning' : 'success'
      }
    ];

    if (isHighRisk || stepUpRequired) {
      timeline.push({
        step: 4,
        title: 'Biometric Step-Up Verification',
        detail: faceVerified
          ? 'Live Face ID verification successful. Identity verified against neural profile.'
          : 'High risk detected: Step-up Face ID verification required.',
        timestamp: `${dateStr} ${timeStr}`,
        status: faceVerified ? 'success' : 'held'
      });
    }

    timeline.push({
      step: (isHighRisk || stepUpRequired) ? 5 : 4,
      title: (isHighRisk && !faceVerified) ? 'Security Hold & Flagged for Review' : 'Ledger Settlement Complete',
      detail: (isHighRisk && !faceVerified)
        ? 'Transaction flagged by AI engine and held pending compliance investigation.'
        : 'Atomic double-entry ledger balance updated. Payment successful.',
      timestamp: `${dateStr} ${timeStr}`,
      status: (isHighRisk && !faceVerified) ? 'held' : 'success'
    });

    newTxn.securityTimeline = timeline;
    this.transactions.unshift(newTxn);

    // 2. Atomic Double-Entry Ledger Bookkeeping
    if (status === 'Completed') {
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

  // ── MULTI-ACCOUNT MANAGEMENT ──────────────────────────────

  getAccounts() {
    return this.accounts;
  }

  getAccountById(id) {
    return this.accounts.find(a => a.id === id);
  }

  addAccount(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Account holder name is required');
    }

    const name = data.name.trim();
    // Compute avatar initials
    const parts = name.split(/\s+/);
    const avatar = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();

    // Determine next sequential ID and Account Number
    const maxNum = this.accounts.reduce((max, a) => {
      const n = parseInt((a.id || '').replace('USR', ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 5);
    const nextId = 'USR' + String(maxNum + 1).padStart(3, '0');
    const nextAccNum = 'SLAC' + String(maxNum + 1).padStart(6, '0');

    const balance = Math.max(0, parseInt(data.balance, 10) || 15000);
    const accountType = data.accountType || 'Savings';
    const email = data.email && data.email.trim()
      ? data.email.trim()
      : `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@secureledger.dev`;
    const phone = data.phone && data.phone.trim()
      ? data.phone.trim()
      : `+91 ${Math.floor(90000 + Math.random() * 9000)} ${Math.floor(10000 + Math.random() * 90000)}`;

    const last4 = Math.floor(1000 + Math.random() * 9000);
    const card = {
      id: `CARD${nextId}`,
      number: `4532 •••• •••• ${last4}`,
      holder: name.toUpperCase(),
      expiry: '12/31',
      cvv: String(Math.floor(100 + Math.random() * 900)),
      type: accountType === 'Current' ? 'Mastercard World' : 'Visa Platinum'
    };

    const newAccount = {
      id: nextId,
      name,
      email,
      phone,
      avatar,
      role: 'user',
      accountNumber: nextAccNum,
      ifsc: 'SLB0001234',
      accountType,
      balance,
      creditScore: 740 + Math.floor(Math.random() * 60),
      riskProfile: 'Low',
      riskScore: 8,
      location: data.location || 'India',
      kycStatus: 'verified',
      isDemo: false,
      faceEnrolled: false,
      pinHash: data.pinHash || '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
      card,
      createdAt: new Date().toISOString()
    };

    this.accounts.push(newAccount);

    // Sync to this.users so transfers to/from this user work seamlessly
    this.users.push({
      id: nextId,
      name,
      avatar,
      accountId: nextAccNum,
      balance,
      risk: 'low',
      riskScore: 8,
      location: newAccount.location,
      txnCount: 1,
      totalAmount: balance,
      avgTxn: balance
    });

    // Opening Deposit Transaction
    const txnId = 'TXN' + (1000 + this.transactions.length + 1);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const welcomeTxn = {
      id: txnId,
      date: dateStr,
      time: timeStr,
      sender: 'SecureLedger Central Treasury',
      senderAcc: 'SLAC000000',
      receiver: name,
      receiverAcc: nextAccNum,
      amount: balance,
      type: 'Credit',
      category: 'Deposit',
      risk: 'low',
      riskScore: 1,
      status: 'Completed',
      location: newAccount.location,
      device: 'Core Banking Engine',
      method: 'Account Opening Deposit',
      note: 'Account Opening Initial Deposit',
      reasons: []
    };
    this.transactions.unshift(welcomeTxn);

    // Double-entry record
    this.journalEntries.push(
      { id: `JE-${txnId}-1`, txnId, account: 'SLAC000000', type: 'DEBIT', amount: balance, date: dateStr },
      { id: `JE-${txnId}-2`, txnId, account: nextAccNum, type: 'CREDIT', amount: balance, date: dateStr }
    );

    this._saveToDisk();

    // Async sync to MySQL if active
    if (mysqlClient.isConnected) {
      mysqlClient.execute(
        `INSERT INTO accounts (id, name, email, phone, avatar, role, account_number, ifsc, account_type, balance, credit_score, risk_profile, risk_score, location, kyc_status, is_demo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newAccount.id, newAccount.name, newAccount.email, newAccount.phone, newAccount.avatar, newAccount.role, newAccount.accountNumber, newAccount.ifsc, newAccount.accountType, newAccount.balance, newAccount.creditScore, newAccount.riskProfile, newAccount.riskScore, newAccount.location, newAccount.kycStatus, false]
      ).catch(e => console.warn('[MySQL] Account insert notice:', e.message));
    }

    return newAccount;
  }

  deleteAccount(id) {
    if (id === 'USR001' || id === 'USR002') {
      throw new Error('Demo accounts (Rahim & Arjun Sharma) are protected and cannot be deleted.');
    }

    const idx = this.accounts.findIndex(a => a.id === id);
    if (idx === -1) {
      throw new Error(`Account with ID ${id} not found`);
    }

    const [deleted] = this.accounts.splice(idx, 1);
    this.users = this.users.filter(u => u.id !== id);

    // If currently active account was deleted, switch back to Rahim
    if (this.currentUser.id === id) {
      this.currentUser = { ...this.accounts[0] };
    }

    this._saveToDisk();

    // Async sync to MySQL if active
    if (mysqlClient.isConnected) {
      mysqlClient.execute(`DELETE FROM accounts WHERE id = ?`, [id])
        .catch(e => console.warn('[MySQL] Account delete notice:', e.message));
    }

    return { success: true, deletedId: id, account: deleted };
  }

  switchAccount(id) {
    const acc = this.accounts.find(a => a.id === id);
    if (!acc) throw new Error('Account not found');
    this.currentUser = { ...acc };
    this._saveToDisk();
    return this.currentUser;
  }

  // ── UPI PIN SECURITY & VERIFICATION ───────────────────────

  verifyPin(accountId, pinHash) {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const now = Date.now();
    const attempts = this.pinAttempts.get(accountId) || { count: 0, lockoutUntil: 0 };

    if (attempts.lockoutUntil > now) {
      const remainingSec = Math.ceil((attempts.lockoutUntil - now) / 1000);
      return {
        success: false,
        locked: true,
        remainingSec,
        message: `Account locked due to consecutive incorrect PIN attempts. Try again in ${remainingSec}s.`
      };
    }

    const expectedHash = account.pinHash || '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

    if (pinHash === expectedHash) {
      this.pinAttempts.delete(accountId);
      return { success: true, message: 'UPI PIN verified successfully' };
    } else {
      attempts.count = (attempts.count || 0) + 1;
      if (attempts.count >= 3) {
        attempts.lockoutUntil = now + 30000; // 30-second lockout
        attempts.count = 0;
        this.pinAttempts.set(accountId, attempts);
        return {
          success: false,
          locked: true,
          remainingSec: 30,
          attemptsLeft: 0,
          message: 'Too many incorrect attempts. Locked for 30 seconds for security.'
        };
      } else {
        const attemptsLeft = 3 - attempts.count;
        this.pinAttempts.set(accountId, attempts);
        return {
          success: false,
          locked: false,
          attemptsLeft,
          message: `Incorrect UPI PIN. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`
        };
      }
    }
  }

  setPin(accountId, pinHash) {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) throw new Error('Account not found');
    account.pinHash = pinHash;
    if (this.currentUser.id === accountId) {
      this.currentUser.pinHash = pinHash;
    }
    this._saveToDisk();
    return { success: true, message: 'UPI PIN updated successfully' };
  }
}

module.exports = new LedgerDatabase();
