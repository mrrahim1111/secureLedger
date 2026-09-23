// ─────────────────────────────────────────────────────────────
// SecureLedger — Client-Side API Communication & Sync Layer
// Connects UI with Express Backend & WebSockets with Fallback
// ─────────────────────────────────────────────────────────────

const API = {
  baseUrl: window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:3000',
  isBackendConnected: false,
  socket: null,
  eventListeners: {},

  /**
   * Initializes and checks connectivity with the backend server & WebSocket
   */
  async init() {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        this.isBackendConnected = true;
        console.log('⚡ Connected to SecureLedger Backend API at', this.baseUrl);
        this._initSocket();
        return true;
      }
    } catch (e) {
      this.isBackendConnected = false;
      console.info('ℹ️ Running in Client-Side Standalone Mode (API offline or static file access)');
    }
    return false;
  },

  _initSocket() {
    if (typeof io !== 'undefined' && this.isBackendConnected) {
      try {
        this.socket = io(this.baseUrl, { transports: ['websocket', 'polling'] });
        
        this.socket.on('connect', () => {
          console.log('⚡ Real-time WebSocket connection established');
        });

        this.socket.on('transaction:new', (data) => {
          this._emit('transaction:new', data);
        });

        this.socket.on('alert:new', (data) => {
          this._emit('alert:new', data);
        });

        this.socket.on('alert:updated', (data) => {
          this._emit('alert:updated', data);
        });
      } catch (err) {
        console.warn('Socket.IO initialization error:', err);
      }
    }
  },

  on(event, callback) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(callback);
  },

  _emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(cb => {
        try { cb(data); } catch (err) { console.error('Socket event handler error:', err); }
      });
    }
  },

  /**
   * Pre-screens a transaction for AI fraud risk before committing
   */
  async screenTransaction(payload) {
    if (this.isBackendConnected) {
      try {
        const res = await fetch(`${this.baseUrl}/api/transactions/screen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API Screen fallback:', err);
      }
    }
    // Standalone fallback using client-side calculation
    return this._localScreenTransaction(payload);
  },

  /**
   * Executes double-entry payment transaction
   */
  async sendPayment(payload) {
    if (this.isBackendConnected) {
      try {
        const res = await fetch(`${this.baseUrl}/api/transactions/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API Send fallback:', err);
      }
    }
    return this._localProcessPayment(payload);
  },

  /**
   * Cryptographic biometric verification challenge
   */
  async verifyBiometric(type = 'face', passkeyCredential = null) {
    if (this.isBackendConnected) {
      try {
        const res = await fetch(`${this.baseUrl}/api/auth/biometric-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, challenge: Date.now(), passkeyCredential })
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API Biometric fallback:', err);
      }
    }
    // Realistic simulation fallback
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          type,
          confidence: passkeyCredential ? 0.999 : 0.988,
          verifiedAt: new Date().toISOString(),
          biometricProofToken: `bio_prf_${Date.now()}`,
          hardwareBacked: !!passkeyCredential
        });
      }, 400);
    });
  },

  /**
   * Native Hardware WebAuthn FIDO2 Passkey Prompt
   */
  async authenticateWithPasskey() {
    if (window.PublicKeyCredential && navigator.credentials) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'preferred',
            rpId: window.location.hostname || 'localhost'
          }
        });

        if (credential) {
          return await this.verifyBiometric('touch', { id: credential.id, type: credential.type });
        }
      } catch (err) {
        console.info('Native WebAuthn cancelled or not configured on domain, switching to scanner HUD:', err.message);
      }
    }
    return null;
  },

  /**
   * Fetches latest fraud alerts
   */
  async getAlerts() {
    if (this.isBackendConnected) {
      try {
        const res = await fetch(`${this.baseUrl}/api/alerts`);
        if (res.ok) {
          const data = await res.json();
          return data.alerts;
        }
      } catch (err) {
        console.warn('API Alerts fallback:', err);
      }
    }
    return window.fraudAlerts || [];
  },

  /**
   * Updates an alert status (Resolve / Confirm Fraud / Block)
   */
  async updateAlert(alertId, action) {
    if (this.isBackendConnected) {
      try {
        const res = await fetch(`${this.baseUrl}/api/alerts/${alertId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API Update Alert fallback:', err);
      }
    }
    // Local update
    const alert = (window.fraudAlerts || []).find(a => a.id === alertId);
    if (alert) {
      if (action === 'normal') alert.status = 'False Positive';
      else if (action === 'fraud') alert.status = 'Confirmed Fraud';
      else if (action === 'block') alert.status = 'Blocked';
    }
    return { success: true, alert };
  },

  // ── LOCAL FALLBACK COMPUTATION ────────────────────────────
  _localScreenTransaction({ receiverName, amount }) {
    const numAmount = parseInt(amount, 10) || 0;
    const isFlagged = receiverName.toLowerCase().includes('unknown') || receiverName.toLowerCase().includes('high-risk');
    let score = 5;
    const reasons = [];

    if (numAmount >= 50000) {
      score += 45;
      reasons.push(`Transaction amount (₹${numAmount.toLocaleString('en-IN')}) is 33× above normal average`);
    } else if (numAmount >= 10000) {
      score += 25;
      reasons.push('Elevated payment volume requires enhanced authentication');
    }

    if (isFlagged) {
      score += 45;
      reasons.push(`Recipient (${receiverName}) is flagged in high-risk registry`);
    }

    const level = score >= 70 ? 'high' : score > 30 ? 'medium' : 'low';
    if (reasons.length === 0) reasons.push('Normal behavioral baseline match');

    return {
      success: true,
      risk: { score, level, reasons },
      requiresBiometricStepUp: level === 'high' || numAmount >= 10000
    };
  },

  _localProcessPayment({ receiverName, amount, description }) {
    const numAmount = parseInt(amount, 10);
    const screen = this._localScreenTransaction({ receiverName, amount });
    const isHigh = screen.risk.level === 'high';
    const txnId = 'TXN' + (1000 + (window.transactions?.length || 10) + 1);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);

    const newTxn = {
      id: txnId,
      date: dateStr,
      time: timeStr,
      sender: 'Rahim',
      senderAcc: 'SLAC000001',
      receiver: receiverName,
      receiverAcc: 'SLAC' + Math.floor(100000 + Math.random() * 900000),
      amount: numAmount,
      type: 'Debit',
      category: 'Transfer',
      risk: screen.risk.level,
      riskScore: screen.risk.score,
      status: isHigh ? 'Review' : 'Completed',
      location: 'Kakinada',
      device: 'iPhone 15 Pro',
      method: 'UPI Instant',
      note: description || '',
      reasons: screen.risk.reasons
    };

    if (window.transactions) window.transactions.unshift(newTxn);
    if (!isHigh && window.currentUser) {
      window.currentUser.balance -= numAmount;
    }

    return {
      success: true,
      transaction: newTxn,
      risk: screen.risk,
      newBalance: window.currentUser ? window.currentUser.balance : 25430
    };
  }
};

// Auto-check connectivity on load
document.addEventListener('DOMContentLoaded', () => {
  API.init();
});
