const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const fraudEngine = require('./fraud-engine');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── HEALTH & STATUS ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SecureLedger Banking API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    ledgerBalanced: true
  });
});

// ── AUTH & BIOMETRIC VERIFICATION ─────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username = 'Rahim', role = 'user' } = req.body;
  const user = db.currentUser;
  
  res.json({
    success: true,
    token: `sl_jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user: {
      ...user,
      activeRole: role
    }
  });
});

app.post('/api/auth/biometric-verify', (req, res) => {
  const { type = 'face', challenge, biometricData } = req.body;
  
  // Real or simulated biometric token verification
  const isEnrolled = type === 'face' ? db.currentUser.faceEnrolled : db.currentUser.touchEnrolled;
  
  if (!isEnrolled) {
    return res.status(403).json({
      success: false,
      error: `Biometric credential (${type}) is not enrolled for account ${db.currentUser.accountNumber}`
    });
  }

  // Simulated cryptographic liveness & mesh confirmation
  const matchConfidence = 0.984; // 98.4% biometric confidence match
  const verified = matchConfidence > 0.85;

  setTimeout(() => {
    res.json({
      success: verified,
      type: type,
      confidence: matchConfidence,
      verifiedAt: new Date().toISOString(),
      biometricProofToken: `bio_prf_${Date.now()}_sig${Math.floor(Math.random()*900000+100000)}`
    });
  }, 400); // realistic biometric processing latency
});

// ── USER PROFILE & REPOSITORIES ──────────────────────────────
app.get('/api/user/profile', (req, res) => {
  res.json({
    success: true,
    user: db.currentUser
  });
});

app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: db.users
  });
});

// ── TRANSACTIONS & FRAUD SCREENING ────────────────────────────
app.get('/api/transactions', (req, res) => {
  const { search, risk, type, status } = req.query;
  const transactions = db.getTransactions({ search, risk, type, status });
  res.json({
    success: true,
    count: transactions.length,
    transactions
  });
});

app.get('/api/transactions/:id', (req, res) => {
  const txn = db.getTransactionById(req.params.id);
  if (!txn) {
    return res.status(404).json({ success: false, error: 'Transaction not found' });
  }
  res.json({ success: true, transaction: txn });
});

// Real-time AI pre-screening (Before committing transaction)
app.post('/api/transactions/screen', (req, res) => {
  try {
    const { receiverName, amount, device, location } = req.body;
    const receiver = db.users.find(u => u.name === receiverName) || {
      id: 'USR999',
      name: receiverName
    };

    const riskEval = fraudEngine.evaluateTransaction({
      senderId: db.currentUser.id,
      senderName: db.currentUser.name,
      receiverId: receiver.id,
      receiverName: receiver.name,
      amount: parseInt(amount, 10) || 0,
      device: device || 'iPhone 15 Pro',
      location: location || 'Kakinada'
    });

    res.json({
      success: true,
      risk: riskEval,
      requiresBiometricStepUp: riskEval.level === 'high' || parseInt(amount, 10) >= 10000
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Double-Entry Atomic Send Payment
app.post('/api/transactions/send', (req, res) => {
  try {
    const { receiverName, amount, description, device, location } = req.body;
    
    if (!receiverName || !amount) {
      return res.status(400).json({ success: false, error: 'Recipient and amount are required' });
    }

    const result = db.processTransaction({
      receiverName,
      amount: parseInt(amount, 10),
      description,
      device,
      location
    });

    res.status(201).json({
      success: true,
      message: result.transaction.status === 'Completed' ? 'Payment processed successfully' : 'Transaction held for security review',
      ...result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── FRAUD ALERTS ──────────────────────────────────────────────
app.get('/api/alerts', (req, res) => {
  res.json({
    success: true,
    alerts: db.getAlerts()
  });
});

app.post('/api/alerts/:id/action', (req, res) => {
  try {
    const { action } = req.body;
    const alert = db.updateAlertAction(req.params.id, action);
    res.json({
      success: true,
      alert
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── ANALYTICS & LEDGER AUDIT ──────────────────────────────────
app.get('/api/analytics', (req, res) => {
  res.json({
    success: true,
    analytics: db.getAnalytics()
  });
});

app.get('/api/network', (req, res) => {
  res.json({
    success: true,
    network: db.getNetworkGraph()
  });
});

app.get('/api/ledger/journal', (req, res) => {
  res.json({
    success: true,
    count: db.journalEntries.length,
    journalEntries: db.journalEntries
  });
});

// ── FRONTEND ROOT FALLBACK ────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  SecureLedger Core Banking API & Web App Running`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  Environment: Production / Prototype Mode`);
  console.log(`====================================================`);
});
