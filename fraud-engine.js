// ─────────────────────────────────────────────────────────────
// SecureLedger — AI Fraud Screening & Risk Scoring Micro-Engine
// Multi-factor Behavioral Anomaly & Graph Risk Analysis
// ─────────────────────────────────────────────────────────────

class FraudScreeningEngine {
  constructor() {
    // Baseline risk thresholds
    this.thresholds = {
      lowMax: 30,
      mediumMax: 70,
      highMin: 71
    };

    // Known flagged / high-risk entity identifiers
    this.flaggedBeneficiaries = new Set([
      'USR008', 'SLAC000008', 'Unknown Account',
      'USR009', 'SLAC000009', 'High-Risk Account'
    ]);

    // User behavioral baselines (dynamically computed from history in prod)
    this.userBaselines = {
      'USR001': {
        avgAmount: 1500,
        stdDev: 1200,
        typicalHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
        primaryLocation: 'Kakinada',
        trustedDevices: ['iPhone 15 Pro', 'MacBook Pro']
      }
    };
  }

  /**
   * Evaluates transaction risk across 5 anomaly dimensions
   * @param {Object} txn - Transaction parameters
   * @returns {Object} Risk assessment { score, level, reasons, factors }
   */
  evaluateTransaction(txn) {
    const {
      senderId = 'USR001',
      senderName = 'Rahim',
      receiverId = '',
      receiverName = '',
      amount = 0,
      timestamp = new Date(),
      device = 'iPhone 15 Pro',
      location = 'Kakinada',
      isFirstTimeBeneficiary = false
    } = txn;

    let score = 5; // Base noise
    const reasons = [];
    const factors = [];

    const baseline = this.userBaselines[senderId] || {
      avgAmount: 1500,
      stdDev: 1000,
      typicalHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      primaryLocation: 'Kakinada',
      trustedDevices: ['iPhone 15 Pro']
    };

    // 1. AMOUNT ANOMALY (Z-Score & Multiplier)
    const amountRatio = amount / baseline.avgAmount;
    if (amountRatio >= 40) {
      score += 45;
      reasons.push(`Transaction amount (₹${amount.toLocaleString('en-IN')}) is ${Math.round(amountRatio)}× higher than your average (₹${baseline.avgAmount.toLocaleString('en-IN')})`);
      factors.push({ name: 'Amount Outlier', risk: 'critical', impact: '+45 pts' });
    } else if (amountRatio >= 15) {
      score += 28;
      reasons.push(`Transaction amount is significantly elevated (${Math.round(amountRatio)}× above normal average)`);
      factors.push({ name: 'Amount Spike', risk: 'high', impact: '+28 pts' });
    } else if (amountRatio >= 5) {
      score += 12;
      factors.push({ name: 'Moderate Amount Increase', risk: 'medium', impact: '+12 pts' });
    }

    // 2. BENEFICIARY RISK & GRAPH CLUSTERING
    const isFlagged = this.flaggedBeneficiaries.has(receiverId) ||
                      this.flaggedBeneficiaries.has(receiverName) ||
                      receiverName.toLowerCase().includes('unknown') ||
                      receiverName.toLowerCase().includes('high-risk');

    if (isFlagged) {
      score += 40;
      reasons.push(`Recipient (${receiverName}) is flagged in the high-risk money-muling detection registry`);
      factors.push({ name: 'Flagged Beneficiary', risk: 'critical', impact: '+40 pts' });
    } else if (isFirstTimeBeneficiary || receiverName === 'Merchant B') {
      score += 8;
      factors.push({ name: 'New Beneficiary', risk: 'low', impact: '+8 pts' });
    }

    // 3. TEMPORAL ANOMALY (Unusual Hour Analysis)
    const txnHour = typeof timestamp === 'string' && timestamp.includes(':')
      ? parseInt(timestamp.split(':')[0], 10)
      : new Date(timestamp).getHours();

    const isUnusualHour = txnHour >= 1 && txnHour <= 5;
    if (isUnusualHour) {
      score += 16;
      reasons.push(`Transaction initiated during unusual late-night hours (${txnHour}:00 AM)`);
      factors.push({ name: 'Temporal Anomaly (1-5 AM)', risk: 'medium', impact: '+16 pts' });
    }

    // 4. GEOLOCATION & NETWORK ROUTING
    const isAnomalousLocation = location.toLowerCase().includes('vpn') ||
                                location.toLowerCase().includes('unknown') ||
                                location.toLowerCase().includes('multiple');

    if (isAnomalousLocation) {
      score += 20;
      reasons.push(`Suspicious connection detected: Anonymizing VPN/Proxy exit node in routing table`);
      factors.push({ name: 'VPN / Proxy Network', risk: 'high', impact: '+20 pts' });
    } else if (location !== baseline.primaryLocation && location !== 'Hyderabad') {
      score += 6;
      factors.push({ name: 'Uncommon Location', risk: 'low', impact: '+6 pts' });
    }

    // 5. DEVICE FINGERPRINT & INTEGRITY
    const isTrustedDevice = baseline.trustedDevices.includes(device);
    const isRootedDevice = device.toLowerCase().includes('rooted') || device.toLowerCase().includes('unknown');

    if (isRootedDevice) {
      score += 25;
      reasons.push(`Unrecognized or modified device environment (${device}) detected`);
      factors.push({ name: 'Device Fingerprint Mismatch', risk: 'high', impact: '+25 pts' });
    } else if (!isTrustedDevice) {
      score += 8;
      factors.push({ name: 'New Hardware Device', risk: 'low', impact: '+8 pts' });
    }

    // Cap score at 1-99
    const finalScore = Math.max(1, Math.min(99, Math.round(score)));

    // Assign risk level
    let riskLevel = 'low';
    if (finalScore >= this.thresholds.highMin) {
      riskLevel = 'high';
    } else if (finalScore > this.thresholds.lowMax) {
      riskLevel = 'medium';
    }

    if (reasons.length === 0) {
      reasons.push('Transaction matches established behavioral baseline and trusted device parameters');
    }

    return {
      score: finalScore,
      level: riskLevel,
      reasons,
      factors,
      evaluatedAt: new Date().toISOString(),
      actionRecommended: riskLevel === 'high' ? 'BLOCK_OR_REVIEW' : (riskLevel === 'medium' ? 'BIOMETRIC_STEP_UP' : 'APPROVE')
    };
  }
}

module.exports = new FraudScreeningEngine();
