// ─────────────────────────────────────────────────────────────────────────────
// UPIPaymentFlow — Multi-Step Payment Engine
// SecureLedger – College Prototype (Simulated, no real money)
// Steps: select → amount → review → pin → screening → [face step-up] → decision
// ─────────────────────────────────────────────────────────────────────────────

class UPIPaymentFlow {
  constructor(app) {
    this.app = app;
    this.recipient   = null;
    this.amount      = 0;
    this.note        = '';
    this.pinBuffer   = '';
    this.MAX_PIN_LEN  = 6;
    this.pinAttempts  = 0;
    this.MAX_PIN_ATTEMPTS = 3;
    this._faceAnimId    = null;
    this._faceVerifying = false;
    this.beneficiaries  = [];
    this._balanceVisible = true;
  }

  init() {
    this._buildBeneficiaries();
    this.renderQuickContacts();
    this.renderRecentTimeline();
    this._bindKeyboard();
    this._updateBalanceCard();
  }

  _buildBeneficiaries() {
    var staticList = ((window.APP_DATA && window.APP_DATA.users) || []).map(function(u) {
      return {
        id: u.id || u.accountId, name: u.name, accountId: u.accountId,
        upiId: u.name.toLowerCase().replace(/\s+/g, '.') + '.' + (u.accountId || '').toLowerCase() + '@secureledger',
        avatar: u.name.charAt(0).toUpperCase(), risk: u.risk || 'low', verified: true
      };
    });

    var dynamicList = Object.values(this.app.ACCOUNTS || {}).map(function(a) {
      return {
        id: a.id, name: a.name, accountId: a.accountId || a.accountNumber,
        upiId: a.name.toLowerCase().replace(/\s+/g, '.') + '.' + ((a.accountId || a.accountNumber) || '').toLowerCase() + '@secureledger',
        avatar: (a.avatar || a.name.charAt(0)).toUpperCase(), risk: 'low', verified: true
      };
    });

    var seen = new Set();
    var merged = [].concat(staticList, dynamicList).filter(function(b) {
      if (!b.accountId || seen.has(b.accountId)) return false;
      seen.add(b.accountId); return true;
    });

    var currentUserId = (window.currentUser && window.currentUser.id) || this.app.selectedAccountId;
    var currentAccId  = (this.app.ACCOUNTS && this.app.ACCOUNTS[currentUserId]) ? (this.app.ACCOUNTS[currentUserId].accountId || this.app.ACCOUNTS[currentUserId].accountNumber) : null;

    this.beneficiaries = merged.filter(function(b) { return b.accountId !== currentAccId; }).concat([
      { id: 'unknown',  name: 'Unknown Account',  accountId: 'SLAC-UNKN', upiId: 'unknown@highrisk',    avatar: '?', risk: 'high', verified: false },
      { id: 'highrisk', name: 'High-Risk Account', accountId: 'SLAC-HIGH', upiId: 'suspicious@highrisk', avatar: '!', risk: 'high', verified: false }
    ]);
  }

  _updateBalanceCard() {
    var currentUser = window.currentUser || {};
    var accInfo     = (this.app.ACCOUNTS && this.app.ACCOUNTS[currentUser.id]) ? this.app.ACCOUNTS[currentUser.id] : {};
    var balEl       = document.getElementById('upi-card-balance');
    var accEl       = document.getElementById('upi-card-acc-num');
    var vpaEl       = document.getElementById('upi-active-vpa');
    if (balEl)  balEl.textContent = '₹' + ((accInfo.balance || 0)).toLocaleString('en-IN');
    if (accEl)  accEl.textContent = accInfo.accountId || accInfo.accountNumber || currentUser.accountNumber || '—';
    if (vpaEl)  vpaEl.textContent = (currentUser.name || 'user').toLowerCase().replace(/\s+/g, '') + '@secureledger';
  }

  toggleBalanceVisibility() {
    this._balanceVisible = !this._balanceVisible;
    var balEl   = document.getElementById('upi-card-balance');
    var eyeText = document.getElementById('upi-eye-text');
    if (balEl) {
      var currentUser = window.currentUser || {};
      var accInfo     = (this.app.ACCOUNTS && this.app.ACCOUNTS[currentUser.id]) ? this.app.ACCOUNTS[currentUser.id] : {};
      balEl.textContent = this._balanceVisible ? '₹' + ((accInfo.balance || 0)).toLocaleString('en-IN') : '₹ ••••••';
    }
    if (eyeText) eyeText.textContent = this._balanceVisible ? 'Hide Balance' : 'Show Balance';
  }

  renderQuickContacts() {
    var bar = document.getElementById('upi-contacts-bar');
    if (!bar) return;
    var contacts = this.beneficiaries.filter(function(b) { return b.verified; }).slice(0, 6);
    bar.innerHTML = contacts.map(function(c) {
      return '<div class="upi-contact-pill" onclick="app.upi.startPaymentFlow(\'' + c.name.replace(/'/g, "\\'") + '\')">' +
             '<div class="upi-contact-avatar">' + c.avatar + '</div>' +
             '<div class="upi-contact-name">' + c.name.split(' ')[0] + '</div>' +
             '</div>';
    }).join('');
  }

  renderRecentTimeline() {
    var el = document.getElementById('upi-recent-timeline');
    if (!el) return;
    var recent = ((window.APP_DATA && window.APP_DATA.transactions) || []).filter(function(t) { return t.type === 'Debit'; }).slice(0, 5);
    if (!recent.length) {
      el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:12px">No recent transactions</div>';
      return;
    }
    el.innerHTML = recent.map(function(t) {
      return '<div class="upi-recent-item" onclick="app.upi.startPaymentFlow(\'' + t.receiver.replace(/'/g, "\\'") + '\')">' +
             '<div class="upi-recent-avatar">' + t.receiver.charAt(0) + '</div>' +
             '<div class="upi-recent-info">' +
             '<div class="upi-recent-name">' + t.receiver + '</div>' +
             '<div class="upi-recent-date">' + t.date + ' · ' + t.category + '</div>' +
             '</div>' +
             '<div class="upi-recent-amt">₹' + t.amount.toLocaleString('en-IN') + '</div>' +
             '</div>';
    }).join('');
  }

  _bindKeyboard() {
    var self = this;
    document.addEventListener('keydown', function(e) {
      var pinStep = document.getElementById('upi-step-pin');
      if (!pinStep || pinStep.style.display === 'none') return;
      if (e.key >= '0' && e.key <= '9') { self.keypadPress(e.key); e.preventDefault(); }
      else if (e.key === 'Backspace')   { self.keypadBackspace();   e.preventDefault(); }
      else if (e.key === 'Escape')      { self.cancelFlow();        e.preventDefault(); }
    });
  }

  showStep(name) {
    var steps = ['select', 'amount', 'review', 'pin', 'screening', 'success', 'highrisk', 'face', 'decision'];
    steps.forEach(function(s) {
      var el = document.getElementById('upi-step-' + s);
      if (el) el.style.display = s === name ? 'block' : 'none';
    });
    var flowEl = document.getElementById('upi-flow-container');
    var homeEl = document.getElementById('upi-home-view');
    if (flowEl) flowEl.style.display = name ? 'block' : 'none';
    if (homeEl) homeEl.style.display = name ? 'none'  : 'block';
  }

  returnToHome() {
    this.cancelFlow();
  }

  cancelFlow(reason) {
    this._stopFaceCamera();
    this.pinBuffer   = '';
    this.pinAttempts = 0;
    this._renderPinDots();
    var flowEl = document.getElementById('upi-flow-container');
    var homeEl = document.getElementById('upi-home-view');
    if (flowEl) flowEl.style.display = 'none';
    if (homeEl) homeEl.style.display = 'block';
    this._updateBalanceCard();
    this.renderRecentTimeline();
    if (reason) this.app.showToast(reason, 'warning');
  }

  // ── STEP 1: SELECT RECIPIENT ─────────────────────────────────────────────
  startPaymentFlow(recipientName) {
    this._buildBeneficiaries();
    this.recipient   = null;
    this.amount      = 0;
    this.note        = '';
    this.pinBuffer   = '';
    this.pinAttempts = 0;
    var searchEl = document.getElementById('upi-recipient-search');
    if (searchEl) searchEl.value = '';
    this._renderBeneficiaryList('');
    this.showStep('select');
    if (recipientName) {
      var self    = this;
      var match   = this.beneficiaries.find(function(b) { return b.name === recipientName; });
      if (match)  { setTimeout(function() { self.selectRecipient(match); }, 80); return; }
      var partial = this.beneficiaries.find(function(b) { return b.name.toLowerCase().startsWith(recipientName.toLowerCase()); });
      if (partial) setTimeout(function() { self.selectRecipient(partial); }, 80);
    }
  }

  filterRecipients(query) { this._renderBeneficiaryList(query); }

  _renderBeneficiaryList(query) {
    var el = document.getElementById('upi-beneficiaries-list');
    if (!el) return;
    var q = (query || '').toLowerCase().trim();
    var filtered = q
      ? this.beneficiaries.filter(function(b) {
          return b.name.toLowerCase().includes(q) || (b.upiId || '').toLowerCase().includes(q) || (b.accountId || '').toLowerCase().includes(q);
        })
      : this.beneficiaries;
    if (!filtered.length) {
      el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px">No matching contacts</div>';
      return;
    }
    el.innerHTML = filtered.map(function(b) {
      var encoded = encodeURIComponent(JSON.stringify(b));
      return '<div class="upi-bene-item ' + (b.risk === 'high' ? 'risk-high' : '') + '" onclick="app.upi.selectFromEncoded(\'' + encoded + '\')">' +
             '<div class="upi-bene-avatar ' + (b.risk === 'high' ? 'danger' : '') + '">' + b.avatar + '</div>' +
             '<div class="upi-bene-info">' +
             '<div class="upi-bene-name">' + b.name + (b.risk === 'high' ? ' <span class="badge high" style="font-size:10px">HIGH RISK</span>' : '') + '</div>' +
             '<div class="upi-bene-upiid">' + (b.upiId || b.accountId) + '</div>' +
             '</div>' +
             '<div class="upi-bene-arrow">›</div>' +
             '</div>';
    }).join('');
  }

  selectFromEncoded(encoded) {
    try { this.selectRecipient(JSON.parse(decodeURIComponent(encoded))); } catch(e) {}
  }

  selectRecipient(bene) {
    this.recipient = bene;
    var avatar = document.getElementById('upi-amt-rec-avatar');
    var name   = document.getElementById('upi-amt-rec-name');
    var handle = document.getElementById('upi-amt-rec-handle');
    var risk   = document.getElementById('upi-amt-rec-risk');
    if (avatar) avatar.textContent = bene.avatar;
    if (name)   name.textContent   = bene.name;
    if (handle) handle.textContent = bene.upiId || bene.accountId;
    if (risk) {
      if (bene.risk === 'high') {
        risk.textContent = '⚠ High Risk Account';
        risk.style.color = 'var(--danger)'; risk.style.background = 'rgba(239,68,68,0.1)';
      } else {
        risk.textContent = '✓ Verified';
        risk.style.color = 'var(--success)'; risk.style.background = '';
      }
    }
    var currentUser = window.currentUser || {};
    var accInfo = (this.app.ACCOUNTS && this.app.ACCOUNTS[currentUser.id]) ? this.app.ACCOUNTS[currentUser.id] : {};
    var accEl = document.getElementById('upi-amt-src-acc');
    var balEl = document.getElementById('upi-amt-src-bal');
    if (accEl) accEl.textContent = accInfo.accountId || accInfo.accountNumber || currentUser.accountNumber || '—';
    if (balEl) balEl.textContent = '₹' + (accInfo.balance || 0).toLocaleString('en-IN');
    var amtInput = document.getElementById('upi-input-amount');
    if (amtInput) { amtInput.value = ''; amtInput.focus(); }
    var noteInput = document.getElementById('upi-input-note');
    if (noteInput) noteInput.value = '';
    this.showStep('amount');
  }

  // ── STEP 2: AMOUNT ───────────────────────────────────────────────────────
  setAmount(val) {
    var el = document.getElementById('upi-input-amount');
    if (el) { el.value = val; el.focus(); }
  }

  proceedToReview() {
    var amtEl  = document.getElementById('upi-input-amount');
    var noteEl = document.getElementById('upi-input-note');
    var amt    = parseFloat((amtEl ? amtEl.value : '') || 0);
    if (!this.recipient) { this.app.showToast('Please select a recipient first.', 'warning'); return; }
    if (!amt || amt < 1) { this.app.showToast('Please enter a valid amount (min ₹1).', 'warning'); if (amtEl) amtEl.focus(); return; }
    if (amt > 200000)    { this.app.showToast('Amount exceeds ₹2,00,000 limit.', 'danger'); if (amtEl) amtEl.focus(); return; }
    this.amount = amt;
    this.note   = noteEl ? noteEl.value.trim() : '';
    var currentUser = window.currentUser || {};
    var accInfo     = (this.app.ACCOUNTS && this.app.ACCOUNTS[currentUser.id]) ? this.app.ACCOUNTS[currentUser.id] : {};
    this._setText('upi-rev-amount',      '₹' + amt.toLocaleString('en-IN'));
    this._setText('upi-rev-from-name',   currentUser.name || 'You');
    this._setText('upi-rev-from-acc',    accInfo.accountId || accInfo.accountNumber || currentUser.accountNumber || '—');
    this._setText('upi-rev-from-avatar', ((currentUser.avatar || (currentUser.name ? currentUser.name.charAt(0) : 'U')) + '').toUpperCase());
    this._setText('upi-rev-to-name',     this.recipient.name);
    this._setText('upi-rev-to-acc',      this.recipient.accountId || '—');
    this._setText('upi-rev-to-avatar',   this.recipient.avatar);
    this._setText('upi-rev-note',        this.note || '—');
    var now = new Date();
    this._setText('upi-rev-date',   now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }));
    this._setText('upi-rev-time',   now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }));
    this._setText('upi-rev-method', 'SecureLedger UPI');
    this.showStep('review');
  }

  // ── STEP 3: REVIEW → PIN ─────────────────────────────────────────────────
  proceedToPin() {
    this.pinBuffer   = '';
    this.pinAttempts = 0;
    this._renderPinDots();
    var pillEl = document.getElementById('upi-pin-amount-pill');
    if (pillEl) pillEl.textContent = '₹' + this.amount.toLocaleString('en-IN') + ' to ' + (this.recipient ? this.recipient.name : '');
    var errEl = document.getElementById('upi-pin-error');
    if (errEl) errEl.style.display = 'none';
    this.showStep('pin');
  }

  // ── STEP 4: PIN KEYPAD ───────────────────────────────────────────────────
  keypadPress(digit) {
    if (this.pinBuffer.length >= this.MAX_PIN_LEN) return;
    this.pinBuffer += digit;
    this._renderPinDots();
    if (this.pinBuffer.length === this.MAX_PIN_LEN) {
      var self = this;
      setTimeout(function() { self._verifyPin(); }, 150);
    }
  }

  keypadBackspace() {
    if (!this.pinBuffer.length) return;
    this.pinBuffer = this.pinBuffer.slice(0, -1);
    this._renderPinDots();
  }

  keypadClear() { this.pinBuffer = ''; this._renderPinDots(); }

  _renderPinDots() {
    var container = document.getElementById('upi-pin-dots');
    if (!container) return;
    var dots = container.querySelectorAll('.pin-dot');
    var len  = this.pinBuffer.length;
    dots.forEach(function(dot, i) {
      dot.classList.toggle('filled', i < len);
      dot.classList.toggle('active', i === len - 1 && len > 0);
    });
  }

  async _verifyPin() {
    var currentUser = window.currentUser || {};
    var accountId   = currentUser.id || this.app.selectedAccountId || 'USR001';
    var pinHash     = await this.hashPin(this.pinBuffer);
    var errEl = document.getElementById('upi-pin-error');
    if (errEl) errEl.style.display = 'none';
    var result = await API.verifyPin(accountId, pinHash);
    if (result && result.success) {
      this.pinBuffer = '';
      this._renderPinDots();
      this.showStep('screening');
      this._runScreening();
    } else {
      this.pinAttempts++;
      var left = this.MAX_PIN_ATTEMPTS - this.pinAttempts;
      if (errEl) {
        errEl.textContent = left > 0
          ? 'Incorrect PIN. ' + left + ' attempt' + (left === 1 ? '' : 's') + ' remaining.'
          : '❌ Too many incorrect attempts. Transaction cancelled.';
        errEl.style.display = 'block';
      }
      var dotsEl = document.getElementById('upi-pin-dots');
      if (dotsEl) { dotsEl.classList.add('shake'); setTimeout(function() { dotsEl.classList.remove('shake'); }, 600); }
      this.pinBuffer = '';
      this._renderPinDots();
      if (this.pinAttempts >= this.MAX_PIN_ATTEMPTS) {
        var self = this;
        setTimeout(function() { self.cancelFlow('Transaction blocked — too many incorrect PIN attempts.'); }, 1800);
      }
    }
  }

  async hashPin(pin) {
    try {
      var enc = new TextEncoder();
      var buf = await crypto.subtle.digest('SHA-256', enc.encode(pin));
      return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    } catch(e) {
      var h = 0;
      for (var i = 0; i < pin.length; i++) { h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0; }
      return Math.abs(h).toString(16).padStart(64, '0');
    }
  }

  // ── STEP 5: AI SCREENING ─────────────────────────────────────────────────
  _runScreening() {
    // Animate the existing check items: baseline, mule, anomaly
    var checkIds = ['check-baseline', 'check-mule', 'check-anomaly'];
    var dotIds   = ['dot-baseline', 'dot-mule', 'dot-anomaly'];
    var txtIds   = ['txt-baseline', 'txt-mule', 'txt-anomaly'];
    var txts     = [
      'Behavioral baseline validated (30-day average)',
      'Mule wallet database: No match found',
      'Graph topology analysis: Processing...'
    ];

    // Reset
    checkIds.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('pass', 'fail');
    });
    dotIds.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) { el.textContent = '●'; el.style.color = ''; }
    });

    var riskScore = this._computeRisk(this.amount, this.recipient);
    var riskLevel = riskScore >= 75 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
    var flagged   = riskLevel !== 'low';
    var self      = this;
    var i = 0;

    var interval = setInterval(function() {
      if (i < checkIds.length) {
        var isFlagged = flagged && i === checkIds.length - 1;
        var dotEl = document.getElementById(dotIds[i]);
        var txtEl = document.getElementById(txtIds[i]);
        var chkEl = document.getElementById(checkIds[i]);
        if (dotEl) { dotEl.textContent = isFlagged ? '⚠' : '✓'; dotEl.style.color = isFlagged ? 'var(--danger)' : 'var(--success)'; }
        if (txtEl) txtEl.textContent = isFlagged ? 'ANOMALY DETECTED — Transaction deviates from normal pattern' : txts[i];
        if (chkEl) chkEl.classList.add(isFlagged ? 'fail' : 'pass');
        i++;
      } else {
        clearInterval(interval);
        setTimeout(function() { self._showScreeningResult(riskScore, riskLevel); }, 600);
      }
    }, 420);
  }

  _computeRisk(amount, recipient) {
    var score = 10;
    if (amount > 50000)      score += 35;
    else if (amount > 15000) score += 20;
    else if (amount > 5000)  score += 10;
    if (!recipient || !recipient.verified || recipient.risk === 'high') score += 40;
    var hour = new Date().getHours();
    if (hour < 5 || hour >= 23) score += 15;
    score += Math.floor(Math.random() * 6);
    return Math.min(100, score);
  }

  _showScreeningResult(riskScore, riskLevel) {
    var self = this;
    if (riskLevel === 'low' || riskLevel === 'medium') {
      // Show success step
      this._submitTransaction(riskScore, riskLevel, false);
    } else {
      // High risk — go to highrisk step
      this._populateHighRiskDetails(riskScore);
      setTimeout(function() { self.showStep('highrisk'); }, 500);
    }
  }

  _populateHighRiskDetails(riskScore) {
    var scoreEl = document.getElementById('upi-risk-score');
    if (scoreEl) scoreEl.textContent = riskScore + ' / 100';
    var amtEl = document.getElementById('upi-risk-amount');
    if (amtEl) amtEl.textContent = '₹' + this.amount.toLocaleString('en-IN');
    var recEl = document.getElementById('upi-risk-recipient');
    if (recEl && this.recipient) recEl.textContent = this.recipient.name;
    var reasons = [];
    if (this.amount > 50000) reasons.push('Unusually large transaction (₹' + this.amount.toLocaleString('en-IN') + ')');
    if (!this.recipient || !this.recipient.verified) reasons.push('Unverified or unknown recipient account');
    if (this.recipient && this.recipient.risk === 'high') reasons.push('Recipient flagged HIGH RISK in fraud database');
    var h = new Date().getHours();
    if (h < 5 || h >= 23) reasons.push('Off-hours transaction (late night / early morning)');
    if (!reasons.length) reasons.push('Behavioral anomaly — deviates from your normal pattern');
    var listEl = document.getElementById('upi-risk-reasons-list');
    if (listEl) listEl.innerHTML = reasons.map(function(r) { return '<li>' + r + '</li>'; }).join('');
  }

  // ── STEP 6b: FACE STEP-UP ───────────────────────────────────────────────
  startFaceStepUp() {
    var accountId = (window.currentUser && window.currentUser.id) || this.app.selectedAccountId || 'USR001';
    var account   = (this.app.ACCOUNTS && this.app.ACCOUNTS[accountId]) ? this.app.ACCOUNTS[accountId] : {};
    var nameEl    = document.getElementById('upi-face-account-name');
    if (nameEl) nameEl.textContent = account.name || 'User';
    this.showStep('face');
    this._startFaceCamera(accountId, account);
  }

  async _startFaceCamera(accountId, account) {
    var video    = document.getElementById('upi-face-video');
    var canvas   = document.getElementById('upi-face-canvas');
    var statusEl = document.getElementById('upi-face-status-text');
    var detailEl = document.getElementById('upi-face-step-detail');
    var badgeEl  = document.getElementById('upi-face-status-badge');
    var confBar  = document.getElementById('upi-face-conf-bar');
    var viewport = document.getElementById('upi-face-viewport');
    var self     = this;

    if (!window.FaceRec) { this._showFaceError('Face recognition library not loaded.'); return; }
    if (!this.app.faceModelsLoaded) {
      if (statusEl) statusEl.textContent = 'Loading AI models…';
      var ok = await window.FaceRec.loadModels();
      if (!ok) { this._showFaceError('Failed to load AI face models.'); return; }
      this.app.faceModelsLoaded = true;
    }
    if (!window.FaceRec.isEnrolled(accountId)) {
      this._showFaceError((account.name || 'User') + "'s face is not enrolled. Enroll first from the login screen.");
      return;
    }
    if (statusEl) statusEl.textContent = 'Starting camera…';
    var camOk = await window.FaceRec.startCamera(video);
    if (!camOk) { this._showFaceError('Camera access denied.'); return; }

    var ctx = canvas.getContext('2d');
    this._faceVerifying = true;
    var drawMesh = function() {
      if (!self._faceVerifying) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var cx = canvas.width / 2, cy = canvas.height / 2;
      ctx.strokeStyle = 'rgba(56,189,248,.7)'; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.ellipse(cx, cy, 70, 88, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.8;
      var ey = Math.sin(Date.now() * 0.003) * 2;
      ctx.fillStyle = 'rgba(56,189,248,.9)';
      ctx.beginPath(); ctx.arc(cx - 22, cy - 14 + ey, 3, 0, Math.PI * 2); ctx.arc(cx + 22, cy - 14 + ey, 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      self._faceAnimId = requestAnimationFrame(drawMesh);
    };
    this._faceAnimId = requestAnimationFrame(drawMesh);
    if (statusEl) statusEl.textContent = 'Scanning for ' + (account.name || 'User') + '…';
    if (detailEl) detailEl.textContent = 'Align your face inside the circle';

    await window.FaceRec.verifyFace(accountId, video,
      function(msg, confidence) {
        if (statusEl) statusEl.textContent = msg;
        if (confBar && confidence > 0) confBar.style.width = Math.min(confidence, 99) + '%';
      },
      function(dist, confidence) {
        self._faceVerifying = false;
        cancelAnimationFrame(self._faceAnimId);
        window.FaceRec.stopCamera();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.ellipse(canvas.width/2, canvas.height/2, 70, 88, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        if (badgeEl)  badgeEl.classList.add('verified');
        if (viewport) viewport.classList.add('verified');
        if (confBar)  confBar.style.width = '100%';
        if (statusEl) statusEl.textContent = '✓ Identity Confirmed';
        if (detailEl) detailEl.textContent = (account.name || 'User') + ' authenticated · ' + Math.round((1 - dist) * 100) + '% confidence';
        var riskScore = self._computeRisk(self.amount, self.recipient);
        setTimeout(function() { self._submitTransaction(riskScore, 'high', true); }, 1000);
      },
      function(reason) {
        self._faceVerifying = false;
        cancelAnimationFrame(self._faceAnimId);
        window.FaceRec.stopCamera();
        if (viewport) viewport.classList.add('failed');
        if (statusEl) statusEl.textContent = reason === 'not_enrolled' ? 'Not Enrolled' : '✕ Face Not Recognized';
        if (detailEl) detailEl.textContent = 'Face does not match ' + (account.name || 'User') + "'s stored template.";
        setTimeout(function() { self.failFaceStepUp('Face verification failed. Payment blocked for your security.'); }, 2200);
      },
      function(count) {
        if (count > 3 && detailEl) detailEl.textContent = 'No face detected — move closer';
      }
    );
  }

  _showFaceError(msg) {
    var statusEl = document.getElementById('upi-face-status-text');
    var detailEl = document.getElementById('upi-face-step-detail');
    if (statusEl) statusEl.textContent = '⚠ ' + msg;
    if (detailEl) detailEl.textContent = 'Transaction cannot proceed without biometric verification.';
    var self = this;
    setTimeout(function() { self.failFaceStepUp(msg); }, 3000);
  }

  failFaceStepUp(reason) {
    this._stopFaceCamera();
    this.showStep('decision');
    this._renderDecision(false, null, 'high', reason || 'Biometric verification failed.', 0, false);
  }

  _stopFaceCamera() {
    this._faceVerifying = false;
    if (this._faceAnimId) { cancelAnimationFrame(this._faceAnimId); this._faceAnimId = null; }
    if (window.FaceRec) window.FaceRec.stopCamera();
  }

  // ── SUBMIT ───────────────────────────────────────────────────────────────
  async _submitTransaction(riskScore, riskLevel, faceStepUp) {
    var currentUser = window.currentUser || {};
    var accInfo     = (this.app.ACCOUNTS && this.app.ACCOUNTS[currentUser.id]) ? this.app.ACCOUNTS[currentUser.id] : {};
    var self        = this;

    var payload = {
      fromAccountId: currentUser.id || 'USR001',
      receiverName:  this.recipient.name,
      toAccountId:   this.recipient.id || this.recipient.accountId,
      amount:        this.amount,
      description:   this.note,
      note:          this.note,
      riskScore:     riskScore,
      riskLevel:     riskLevel,
      pinVerified:   true,
      faceVerified:  faceStepUp,
      biometricVerified: faceStepUp,
      method:        'UPI'
    };

    try {
      var result = await API.sendPayment(payload);
      if (accInfo && result && result.balance !== undefined) accInfo.balance = result.balance;

      var txnId = (result && (
        (result.transaction && result.transaction.id) ||
        result.transactionId || result.id
      )) || ('TXN' + Math.floor(Math.random() * 90000 + 10000));

      // Update local balance from server response
      if (accInfo && result && result.newBalance !== undefined) accInfo.balance = result.newBalance;

      // Inject into local transaction list
      var localEntry = {
        id:        txnId,
        date:      new Date().toLocaleDateString('en-IN'),
        time:      new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
        sender:    currentUser.name || 'You',
        receiver:  self.recipient.name,
        amount:    self.amount,
        type:      'Debit',
        category:  'UPI Transfer',
        risk:      riskLevel,
        riskScore: riskScore,
        status:    (riskLevel === 'high' && !faceStepUp) ? 'Blocked' : 'Completed',
        note:      self.note,
        method:    'UPI',
        location:  'Secure Session',
        device:    navigator.platform || 'Web'
      };

      if (result && result.transaction) {
        if (!APP_DATA.transactions.some(function(t) { return t.id === result.transaction.id; })) {
          APP_DATA.transactions.unshift(result.transaction);
        }
      } else {
        APP_DATA.transactions.unshift(localEntry);
      }

      if (typeof self.app.renderTransactionTable === 'function') self.app.renderTransactionTable();

      // Show appropriate success or decision step
      if (riskLevel !== 'high' || faceStepUp) {
        self._populateSuccessStep(txnId, riskScore, riskLevel, faceStepUp);
        self.showStep('success');
      } else {
        self.showStep('decision');
        self._renderDecision(false, txnId, riskLevel, 'High-risk transaction blocked.', riskScore, false);
      }

    } catch(err) {
      console.error('Payment error:', err);
      self.showStep('decision');
      self._renderDecision(false, null, riskLevel, 'Network error: ' + (err.message || 'Transaction could not be processed.'), 0, false);
    }
  }

  _populateSuccessStep(txnId, riskScore, riskLevel, faceVerified) {
    var now = new Date();
    this._setText('upi-succ-amount',    '₹' + this.amount.toLocaleString('en-IN'));
    this._setText('upi-succ-recipient', this.recipient ? this.recipient.name : '');
    this._setText('upi-succ-ref',       'UPI/' + now.getFullYear() + '/' + Math.floor(Math.random() * 900000000 + 100000000));
    this._setText('upi-succ-txnid',     txnId);
    this._setText('upi-succ-time',      now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) + ', ' + now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }));
    var currentUser = window.currentUser || {};
    var accInfo     = (this.app.ACCOUNTS && this.app.ACCOUNTS[currentUser.id]) ? this.app.ACCOUNTS[currentUser.id] : {};
    this._setText('upi-succ-from', (currentUser.name || 'You') + ' (' + (accInfo.accountId || accInfo.accountNumber || '—') + ')');
    var riskEl = document.getElementById('upi-succ-risk');
    if (riskEl) {
      riskEl.textContent = (riskLevel === 'low' ? 'Low' : riskLevel === 'medium' ? 'Medium' : 'High') + ' Risk (' + riskScore + '/100)';
      riskEl.style.color = riskLevel === 'high' ? 'var(--danger)' : riskLevel === 'medium' ? 'var(--warning)' : 'var(--success)';
    }
    var stepUpRow = document.getElementById('upi-succ-stepup-row');
    if (stepUpRow) stepUpRow.style.display = faceVerified ? 'flex' : 'none';
  }

  // ── DECISION CARD (blocked transactions) ─────────────────────────────────
  _renderDecision(success, txnId, riskLevel, errorMsg, riskScore, faceVerified) {
    var card = document.getElementById('upi-decision-card');
    if (!card) return;
    var now     = new Date();
    var timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    var dateStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

    if (success) {
      card.className = 'upi-decision-card success';
      card.innerHTML =
        '<div class="upi-decision-icon success">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:40px;height:40px">' +
            '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' +
          '</svg></div>' +
        '<div class="upi-decision-title">Payment Approved</div>' +
        '<div class="upi-decision-amount">₹' + this.amount.toLocaleString('en-IN') + '</div>' +
        '<div class="upi-decision-sub">Transferred to <strong>' + (this.recipient ? this.recipient.name : '') + '</strong></div>' +
        '<div class="upi-decision-meta-box">' +
          '<div class="upi-decision-row"><span>Transaction ID</span><span class="mono">' + (txnId || '—') + '</span></div>' +
          '<div class="upi-decision-row"><span>Date &amp; Time</span><span>' + dateStr + ' · ' + timeStr + '</span></div>' +
          '<div class="upi-decision-row"><span>Auth</span><span style="color:var(--success)">✓ UPI PIN' + (faceVerified ? ' + Face ID' : '') + '</span></div>' +
        '</div>' +
        '<div class="upi-decision-actions">' +
          '<button class="btn btn-success btn-lg w-full" onclick="app.upi.returnToHome()">Done</button>' +
          '<button class="btn btn-ghost btn-sm w-full mt-10" onclick="app.navigateTo(\'ledger\')">View in Ledger</button>' +
        '</div>';
    } else {
      card.className = 'upi-decision-card failed';
      card.innerHTML =
        '<div class="upi-decision-icon danger">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:40px;height:40px">' +
            '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' +
          '</svg></div>' +
        '<div class="upi-decision-title">Transaction Blocked</div>' +
        '<div class="upi-decision-amount" style="color:var(--danger)">₹' + this.amount.toLocaleString('en-IN') + '</div>' +
        '<div class="upi-decision-sub" style="color:var(--text-secondary)">' + (errorMsg || 'Payment was blocked for security reasons.') + '</div>' +
        '<div class="upi-decision-meta-box">' +
          '<div class="upi-decision-row"><span>Date &amp; Time</span><span>' + dateStr + ' · ' + timeStr + '</span></div>' +
          '<div class="upi-decision-row"><span>Status</span><span style="color:var(--danger)">Blocked &amp; Logged</span></div>' +
        '</div>' +
        '<div class="upi-decision-actions">' +
          '<button class="btn btn-danger btn-lg w-full" onclick="app.upi.returnToHome()">Close</button>' +
          '<button class="btn btn-ghost btn-sm w-full mt-10" onclick="app.navigateTo(\'alerts\')">View Security Alerts</button>' +
        '</div>';
    }
  }

  // ── QR SCANNER (Demo) ────────────────────────────────────────────────────
  openQRModal() {
    var recipients = this.beneficiaries.filter(function(b) { return b.verified; });
    var pick       = recipients[Math.floor(Math.random() * recipients.length)];
    var self       = this;
    if (pick) {
      this.app.showToast('📱 QR scanned: ' + pick.name + ' (' + pick.upiId + ')', 'info');
      setTimeout(function() { self.startPaymentFlow(pick.name); }, 800);
    } else {
      this.app.showToast('QR scan demo: no contact found', 'warning');
    }
  }

  _setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}
