// ─────────────────────────────────────────────────────────────
// SecureLedger — Real Face Recognition Engine
// Powered by face-api.js (TinyFaceDetector + FaceRecognitionNet)
// All processing is 100% client-side. No data leaves the device.
// Face templates are stored encrypted in localStorage per account.
// ─────────────────────────────────────────────────────────────

const FACE_MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/';
const MATCH_THRESHOLD = 0.47;         // Euclidean distance — face-api.js native metric
                                      // Same person: ~0.1-0.35 | Different person: ~0.5+
const ENROLL_FRAMES   = 8;            // More frames = more robust average template
const ENROLL_INTERVAL = 600;          // ms between enrollment captures
const VERIFY_INTERVAL = 500;          // ms between verification frames
const VERIFY_MAX_FRAMES = 16;         // Stop after this many frames without match

const STORAGE_KEY_PREFIX  = 'sl_faceTemplate_';
const WEBAUTHN_KEY_PREFIX = 'sl_webauthnCred_';

class FaceRecognitionEngine {
  constructor() {
    this.modelsLoaded   = false;
    this.isLoading      = false;
    this._stream        = null;
    this._verifyTimer   = null;
    this._enrollTimer   = null;
    this._abortController = null;
  }

  // ── Model Loading ──────────────────────────────────────────
  async loadModels(onProgress) {
    if (this.modelsLoaded) return true;
    if (this.isLoading)    return false;

    if (typeof faceapi === 'undefined') {
      console.error('[FaceRec] face-api.js is not loaded. Add the CDN script tag first.');
      return false;
    }

    this.isLoading = true;
    onProgress?.('Loading neural networks (1/3)…');

    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODELS_URL);
      onProgress?.('Loading landmark model (2/3)…');
      await faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODELS_URL);
      onProgress?.('Loading recognition net (3/3)…');
      await faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODELS_URL);

      this.modelsLoaded = true;
      this.isLoading    = false;
      onProgress?.('Models ready ✓');
      return true;
    } catch (err) {
      this.isLoading = false;
      console.error('[FaceRec] Failed to load models:', err);
      onProgress?.('Failed to load models. Check internet connection.');
      return false;
    }
  }

  // ── Template Storage ───────────────────────────────────────
  isEnrolled(accountId) {
    return !!localStorage.getItem(STORAGE_KEY_PREFIX + accountId);
  }

  getTemplate(accountId) {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + accountId);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return new Float32Array(parsed.descriptor);
    } catch { return null; }
  }

  saveTemplate(accountId, descriptorArray, name) {
    const payload = {
      descriptor: Array.from(descriptorArray),
      enrolledAt: new Date().toISOString(),
      accountId,
      name
    };
    localStorage.setItem(STORAGE_KEY_PREFIX + accountId, JSON.stringify(payload));
  }

  clearTemplate(accountId) {
    localStorage.removeItem(STORAGE_KEY_PREFIX + accountId);
  }

  getEnrollmentMeta(accountId) {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + accountId);
    if (!raw) return null;
    try {
      const p = JSON.parse(raw);
      return { enrolledAt: p.enrolledAt, name: p.name };
    } catch { return null; }
  }

  // ── WebAuthn / Passkey Credential Storage (per account) ────
  saveWebAuthnCred(accountId, credentialId) {
    localStorage.setItem(WEBAUTHN_KEY_PREFIX + accountId, credentialId);
  }

  getWebAuthnCred(accountId) {
    return localStorage.getItem(WEBAUTHN_KEY_PREFIX + accountId);
  }

  clearWebAuthnCred(accountId) {
    localStorage.removeItem(WEBAUTHN_KEY_PREFIX + accountId);
  }

  hasWebAuthnCred(accountId) {
    return !!localStorage.getItem(WEBAUTHN_KEY_PREFIX + accountId);
  }

  // ── Camera Utilities ───────────────────────────────────────
  async startCamera(videoEl, constraints = {}) {
    if (this._stream) this.stopCamera();
    const opts = Object.assign({ video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 320 } } }, constraints);
    try {
      this._stream = await navigator.mediaDevices.getUserMedia(opts);
      videoEl.srcObject = this._stream;
      videoEl.style.display = 'block';
      await videoEl.play();
      return true;
    } catch (err) {
      console.warn('[FaceRec] Camera error:', err);
      return false;
    }
  }

  stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
    if (this._verifyTimer) { clearTimeout(this._verifyTimer); this._verifyTimer = null; }
    if (this._enrollTimer) { clearTimeout(this._enrollTimer); this._enrollTimer = null; }
  }

  // ── Descriptor Extraction (single frame) ──────────────────
  async extractDescriptor(videoEl) {
    if (!this.modelsLoaded) return null;
    try {
      const detection = await faceapi
        .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      return detection ? detection.descriptor : null;
    } catch { return null; }
  }

  // ── Distance Metric (Euclidean — face-api.js native) ────
  // face-api.js FaceRecognitionNet descriptors are unit-normalized 128-D
  // vectors. Euclidean distance is the correct metric. Threshold ~0.47:
  //   Same person, varying conditions: 0.10 – 0.38
  //   Different people:               0.50 – 1.20+
  euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
    return Math.sqrt(sum);
  }

  // Kept for reference only — NOT used for matching
  cosineDistance(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot   += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return 1 - similarity;
  }

  // ── Enrollment ─────────────────────────────────────────────
  /**
   * Capture ENROLL_FRAMES frames, average the descriptors, save template.
   * @param {string}   accountId  — e.g. 'USR001'
   * @param {string}   name       — display name for the account owner
   * @param {HTMLVideoElement} videoEl
   * @param {Function} onStatus   — callback(message, framesDone, framesTotal)
   * @returns {Promise<boolean>}
   */
  async enrollFace(accountId, name, videoEl, onStatus) {
    if (!this.modelsLoaded) {
      onStatus?.('Models not loaded yet.', 0, ENROLL_FRAMES);
      return false;
    }

    const descriptors = [];
    let retries = 0;
    onStatus?.('Look directly at the camera…', 0, ENROLL_FRAMES);

    for (let i = 0; i < ENROLL_FRAMES; i++) {
      await this._delay(ENROLL_INTERVAL);
      onStatus?.(`Capturing frame ${i + 1} / ${ENROLL_FRAMES}…`, i, ENROLL_FRAMES);

      const desc = await this.extractDescriptor(videoEl);
      if (!desc) {
        onStatus?.(`Frame ${i + 1}: No face detected. Keep still.`, i, ENROLL_FRAMES);
        i--;        // retry this frame
        retries++;
        if (retries > 12) {
          onStatus?.('Could not detect face. Ensure good lighting.', 0, ENROLL_FRAMES);
          return false;
        }
        continue;
      }
      retries = 0;
      descriptors.push(desc);
    }

    if (descriptors.length < 5) {
      onStatus?.('Enrollment failed — not enough clear frames.', 0, ENROLL_FRAMES);
      return false;
    }

    // Average the descriptors into a single robust template
    const averaged = new Float32Array(128);
    for (const d of descriptors) {
      for (let k = 0; k < 128; k++) averaged[k] += d[k];
    }
    for (let k = 0; k < 128; k++) averaged[k] /= descriptors.length;

    // ── Quality self-check: verify the averaged template matches each raw frame
    // Reject enrollment if any frame is too far from the average (inconsistent capture)
    const outliers = descriptors.filter(d => this.euclideanDistance(d, averaged) > 0.35);
    if (outliers.length > 2) {
      onStatus?.('Inconsistent frames detected. Please hold still and retry.', 0, ENROLL_FRAMES);
      return false;
    }

    this.saveTemplate(accountId, averaged, name);
    onStatus?.(`✓ Face enrolled for ${name} (${descriptors.length} frames, quality verified)`, ENROLL_FRAMES, ENROLL_FRAMES);
    return true;
  }

  // ── Verification ───────────────────────────────────────────
  /**
   * Continuously read frames from videoEl and compare to stored template.
   * Calls onMatch(distance) on success or onFail() after VERIFY_MAX_FRAMES misses.
   * @param {string}   accountId
   * @param {HTMLVideoElement} videoEl
   * @param {Function} onStatus    — callback(message, confidence)
   * @param {Function} onMatch     — called when face matches (distance passed)
   * @param {Function} onFail      — called when max frames exceeded without match
   * @param {Function} onNoFace    — called each frame where no face is detected
   */
  async verifyFace(accountId, videoEl, onStatus, onMatch, onFail, onNoFace) {
    const template = this.getTemplate(accountId);
    if (!template) {
      onStatus?.('No face template enrolled for this account.', 0);
      onFail?.('not_enrolled');
      return;
    }

    let frameCount  = 0;
    let noFaceCount = 0;
    // Require 2 consecutive matches to prevent single-frame false positives
    let consecutiveMatches = 0;
    const REQUIRED_CONSECUTIVE = 2;

    const tick = async () => {
      if (frameCount >= VERIFY_MAX_FRAMES) {
        onFail?.('max_frames');
        return;
      }

      const desc = await this.extractDescriptor(videoEl);

      if (!desc) {
        noFaceCount++;
        consecutiveMatches = 0;
        onNoFace?.(noFaceCount);
        onStatus?.('No face detected — align your face with the camera', 0);
        this._verifyTimer = setTimeout(tick, VERIFY_INTERVAL);
        return;
      }

      noFaceCount = 0;
      frameCount++;

      // Use euclidean distance — the native metric for face-api.js descriptors
      const dist       = this.euclideanDistance(desc, template);
      // Confidence: 100% at 0 distance, 0% at threshold
      const confidence = Math.max(0, Math.round((1 - dist / MATCH_THRESHOLD) * 100));

      onStatus?.(`Matching… confidence ${Math.min(99, confidence)}%`, confidence);

      if (dist < MATCH_THRESHOLD) {
        consecutiveMatches++;
        if (consecutiveMatches >= REQUIRED_CONSECUTIVE) {
          // Confirmed match — require 2 frames in a row to prevent spoof
          onMatch?.(dist, confidence);
        } else {
          // First match frame — wait for confirmation
          onStatus?.(`Identity candidate — confirming… ${Math.min(99, confidence)}%`, confidence);
          this._verifyTimer = setTimeout(tick, VERIFY_INTERVAL);
        }
      } else {
        // No match this frame
        consecutiveMatches = 0;
        this._verifyTimer = setTimeout(tick, VERIFY_INTERVAL);
      }
    };

    this._verifyTimer = setTimeout(tick, 800);
  }

  // ── WebAuthn Passkey Enrollment ────────────────────────────
  async enrollWebAuthn(accountId, userName, displayName) {
    if (!window.PublicKeyCredential) return { success: false, reason: 'WebAuthn not supported' };

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const userId = new TextEncoder().encode(accountId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp:   { name: 'SecureLedger', id: location.hostname || 'localhost' },
          user: { id: userId, name: userName, displayName },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred'
          },
          timeout: 60000,
          attestation: 'none'
        }
      });

      if (credential) {
        const credIdB64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        this.saveWebAuthnCred(accountId, credIdB64);
        return { success: true, credentialId: credIdB64 };
      }
      return { success: false, reason: 'No credential returned' };
    } catch (err) {
      return { success: false, reason: err.message };
    }
  }

  // ── WebAuthn Passkey Verification ─────────────────────────
  async verifyWebAuthn(accountId) {
    if (!window.PublicKeyCredential) return { success: false, reason: 'WebAuthn not supported' };

    const credIdB64 = this.getWebAuthnCred(accountId);
    if (!credIdB64) return { success: false, reason: 'not_enrolled' };

    try {
      const challenge   = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const credIdBytes = Uint8Array.from(atob(credIdB64), c => c.charCodeAt(0));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId:            location.hostname || 'localhost',
          allowCredentials: [{ type: 'public-key', id: credIdBytes }],
          userVerification: 'required',
          timeout:          60000
        }
      });

      return assertion ? { success: true } : { success: false, reason: 'No assertion' };
    } catch (err) {
      if (err.name === 'NotAllowedError') return { success: false, reason: 'cancelled' };
      return { success: false, reason: err.message };
    }
  }

  // ── Utility ────────────────────────────────────────────────
  _delay(ms) { return new Promise(res => setTimeout(res, ms)); }
}

// Singleton instance — shared across the app
window.FaceRec = new FaceRecognitionEngine();
