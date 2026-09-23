# 🛡️ SecureLedger — AI-Powered Core Banking & Real Biometric Authentication

> A **full-stack digital banking prototype** featuring real facial recognition (face-api.js neural networks), MySQL database architecture, AI-powered fraud screening, 3D transaction network visualization, multi-account management, and WebSocket live streaming — all running natively in the browser with zero external data exposure.

---

## 📌 Project Overview

**SecureLedger** is a high-fidelity fintech web application that simulates a production-grade core banking platform. It integrates:

- **Real facial recognition** (not simulated) using pre-trained neural networks running 100% in the browser
- **Explainable AI fraud detection** with real-time risk scoring from 0–100
- **MySQL relational database** with graceful auto-fallback to a structured persistent ledger store
- **Dynamic multi-account management** — add, switch, and remove bank accounts on the fly
- **Double-entry accounting** — every payment creates atomic DEBIT/CREDIT journal entries that maintain ledger balance invariants
- **3D WebGL transaction network graph** for visual fraud investigation
- **Real-time WebSocket streaming** — fraud alerts and transactions broadcast live across all connected sessions

> ⚠️ **Disclaimer:** All accounts, balances, and profiles are fictional for academic/demonstration purposes. No real banking APIs or real money are involved.

---

## ✨ Complete Feature Reference

### 1. 🧠 Real Face Recognition Biometric Authentication (face-api.js)

The biometric Face ID system uses **actual neural networks** running entirely in-browser — no cloud API, no data transmission, zero privacy risk.

#### How It Works:

```
ENROLL PHASE (one-time per person, per account):
  Webcam → face-api.js (TinyFaceDetector + FaceLandmark68Net + FaceRecognitionNet)
  → 8 video frames captured → Quality Outlier Filter applied
  → Frames with inconsistent embeddings (>0.35 variance) are discarded
  → Valid frames averaged into a single 128-dimensional Float32Array
  → Saved to localStorage["sl_faceTemplate_USR001"] (never transmitted)

VERIFY PHASE (every login or payment authorization):
  Webcam → live 128-D face embedding extracted per frame
  → euclideanDistance(live_embedding, stored_template)
  → Threshold: 0.47
      Same person: typical distance 0.10–0.38 ✓ MATCH
      Different person: typical distance 0.50–1.20 ✗ REJECT
  → 2 consecutive matching frames required before granting access (anti-spoof)
  → Fails after 16 frames without consecutive match → "Access Denied"
```

#### Security Properties:
| Property | Detail |
|---|---|
| **Algorithm** | 128-D facial embedding comparison |
| **Distance Metric** | Euclidean distance (native to face-api.js ResNet architecture) |
| **Match Threshold** | 0.47 (calibrated for low false positive rate) |
| **Consecutive Match** | 2 frames required in sequence before unlock |
| **Anti-Spoof** | Rejects photo replay — live video texture required |
| **Outlier Filter** | Enrollment frames validated for consistency before saving |
| **Data Storage** | `localStorage` only — never sent to any server |
| **Privacy** | 128 numbers cannot be reversed to reconstruct a face image |

#### Models Used (loaded from jsDelivr CDN, cached by browser):
- `tiny_face_detector` — Fast face bounding box detection (~190KB)
- `face_landmark_68` — 68-point facial landmark extraction (~350KB)
- `face_recognition` — ResNet-34 embedding network (~6.2MB)

#### Face ID Features:
- **Per-account templates** — Each account stores its own face template; a face enrolled on Rahim's account cannot unlock Arjun's
- **Live camera overlay** — Real-time facial landmark mesh drawn over the video feed
- **Confidence bar** — Visual indicator showing how close the live face matches the stored template
- **"Re-enroll" button** — Appears on both the login card badge and inside the biometric modal
- **Holographic fallback** — If camera access is denied, a holographic wireframe face animation renders so the UI always functions during demos

---

### 2. 👆 Touch ID (WebAuthn / Passkey Authentication)

- **OS-level biometric enrollment** — First tap on the fingerprint sensor triggers a platform authenticator system dialog (Face ID on Mac, Windows Hello, Android biometrics)
- **Per-account credentials** — Stored separately per account (`sl_webauthnCred_USR001`, etc.)
- **Hardware-backed** — Private keys never leave the device's secure enclave
- **Simulated fallback** — On unsupported browsers, an animated fingerprint sensor pad with scanning laser and ripple effects provides a seamless demo experience
- **Step-up authentication** — Automatically triggered for high-value (≥ ₹10,000) or high-risk payments as a second factor

---

### 3. 🗄️ MySQL Relational Database Architecture

SecureLedger uses a dual-mode database layer: **MySQL for production** with **automatic fallback** to a structured file-based ledger when MySQL is offline.

#### Relational Schema (schema.sql):

| Table | Purpose | Key Columns |
|---|---|---|
| `accounts` | Bank accounts and customer profiles | `id`, `name`, `account_number`, `ifsc`, `account_type`, `balance`, `credit_score`, `risk_profile`, `is_demo` |
| `cards` | Debit/credit cards per account | `account_id`, `card_number`, `card_holder`, `expiry`, `cvv`, `card_type`, `card_limit` |
| `transactions` | All payment records | `sender_acc`, `receiver_acc`, `amount`, `type`, `category`, `risk`, `risk_score`, `status`, `device`, `location`, `method`, `reasons` |
| `journal_entries` | Double-entry accounting lines | `txn_id`, `account_number`, `entry_type` (DEBIT/CREDIT), `amount` |
| `fraud_alerts` | Flagged anomalous transactions | `txn_id`, `risk_score`, `risk_level`, `sender`, `receiver`, `status`, `reasons` |
| `beneficiaries` | Saved transfer recipients | `account_id`, `name`, `account_number`, `ifsc`, `bank_name` |

#### Connection Pool (mysql-client.js):
- Uses `mysql2/promise` with a configurable connection pool (`DB_CONNECTION_LIMIT=10`)
- Reads configuration from `.env` file (see `.env.example`)
- **Health ping on startup** — Tests connection before marking as active
- **Zero-downtime fallback** — Any MySQL connection failure gracefully switches to the structured `data/ledger-store.json` ledger with zero impact to the UI

#### Environment Configuration (.env.example):
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=secureledger
DB_CONNECTION_LIMIT=10
```

To connect to MySQL:
1. Copy `.env.example` to `.env` and fill in your credentials
2. Run `mysql -u root -p < schema.sql` to initialize the database
3. Restart the server — it will auto-detect MySQL and switch to it

---

### 4. 👥 Dynamic Multi-Account Management

All accounts are stored in MySQL (or the fallback ledger) and managed through a full REST API with real-time WebSocket sync.

#### Adding a New Bank Account:
1. Click **"+ Add Account"** on the login screen account selector header (or **"+ Open New Account"** in Settings)
2. Fill in the "Open Bank Account" modal:
   - **Full Legal Name** (required)
   - **Account Type** — Savings, Current, or Salary
   - **Initial Deposit** (₹500 minimum)
   - **Phone Number** (optional)
   - **Email Address** (optional)
3. The system auto-generates:
   - A unique `SLACxxxxxx` account number
   - `SLB0001234` IFSC code
   - A virtual debit card (Visa Platinum or Mastercard World)
   - An **Opening Deposit** credit transaction with double-entry journal records
4. Account appears immediately in the selector — Face ID enrollment is immediately available

#### Removing an Account:
- Click the red **"✕"** button on any custom account card
- Confirm the prompt (irreversible — balance, transactions, and biometric template are removed)
- The system automatically switches back to Rahim's account if the active account was deleted

#### Protected Demo Accounts:
| Account | ID | Protection |
|---|---|---|
| Rahim | `USR001` | 🔒 Cannot be deleted (HTTP 403) |
| Arjun Sharma | `USR002` | 🔒 Cannot be deleted (HTTP 403) |

Demo accounts display a **"Demo"** badge instead of a delete button.

---

### 5. 🤖 AI Fraud Screening Engine (fraud-engine.js)

The AI fraud engine evaluates transactions across **8 behavioral anomaly vectors** and produces a composite risk score from 0–100 with human-readable reasoning:

| Signal | Weight | Example |
|---|---|---|
| **Amount Velocity** | High | "₹75,000 is 52× above your 30-day average of ₹1,450" |
| **Time Anomaly** | Medium | "Transaction initiated at 2:31 AM — unusual hour" |
| **New Beneficiary** | Medium | "First-time transfer to this account" |
| **Flagged Beneficiary** | Critical | "Recipient in financial cybercrime intelligence registry" |
| **Device Fingerprint** | Medium | "Rooted Android / Virtual Machine detected" |
| **VPN / Proxy** | High | "Anonymizing VPN/Tor node routing detected" |
| **Geolocation Jump** | Medium | "Transaction from unexpected country/region" |
| **Velocity Count** | Medium | "5 transactions in the last 30 minutes" |

Risk levels: `low (0–29)` → `medium (30–69)` → `high (70–100)`

High-risk transactions are automatically held with status `"Review"` and generate a `fraud_alerts` record.

---

### 6. 💸 Double-Entry Banking Ledger (db.js)

Every payment atomically creates **two journal entries**:

```
Payment: Rahim → Starbucks Coffee, ₹450

DEBIT  | SLAC000001 (Rahim)           | ₹450
CREDIT | SLAC000012 (Starbucks Coffee) | ₹450

Ledger invariant: Σ DEBIT = Σ CREDIT (always balanced)
```

- **Atomic balance updates** — Both sender debit and receiver credit happen in the same operation
- **High-risk hold** — If fraud score ≥ 70, balances are NOT updated; the transaction is held for review
- **Journal audit trail** — Full history accessible via `/api/ledger/journal`

---

### 7. 🕸️ 3D Transaction Network Graph (Three.js / WebGL)

- **3D nodes** — Each account rendered as a sphere; color-coded (Green = Low risk, Amber = Medium, Red = High)
- **Bezier money flow edges** — Curved arrows with directional cones showing payment direction and amount
- **Raycasting interaction** — Click any node to isolate its transaction edges and display an account detail card below the canvas
- **Camera controls** — Drag to orbit, scroll to zoom, auto-rotation toggle, camera reset
- **Live updates** — New transactions received via WebSocket appear as animated new edges in real time

---

### 8. 📊 Analytics & Behavioral Intelligence (Chart.js)

- **Credit vs. Debit monthly bar chart** — Six-month financial volume comparison
- **Suspicious transaction trend line** — Normal vs. flagged count over time
- **Spending category doughnut chart** — Food, Shopping, Salary, Utilities, Subscriptions, Transfers, Travel
- **Risk distribution pie chart** — Current proportion of low / medium / high risk transactions
- **Fraud alert summary cards** — Total flagged amount, confirmed fraud count, false positive rate

---

### 9. 🚨 Fraud Alert & Investigation Center

- **Alert queue** — Centralized list of all flagged transactions, sorted by severity
- **3D sub-network investigation** — Renders a focused sub-graph showing only the relevant fraud chain (e.g., Rahim → Unknown Offshore Wallet → Crypto P2P Desk)
- **Analyst action buttons:**
  - ✓ **Mark Normal** — Reclassifies as false positive
  - ✗ **Confirm Fraud** — Locks and escalates
  - 🔒 **Block Account** — Prevents further transactions
- **Real-time alert broadcast** — Alert status updates broadcast via WebSocket to all connected analysts simultaneously

---

### 10. ⚡ Real-Time WebSocket Live Feed (Socket.IO)

All connected browser sessions receive:
- `transaction:new` — Instant live feed update when any payment is processed
- `alert:new` — New fraud alert notification with sound and badge count increment
- `alert:updated` — Alert status change broadcast when analyst takes action
- `account:new` — New account card appears in all open login screens
- `account:deleted` — Account card instantly removed from all open sessions

---

### 11. 🎨 UI Design & Micro-Animations

- **Dark Mode** — Rich charcoal (`#09090b`) with metallic silver typography and accent blue (`#3b72ff`)
- **Light Mode** — Clean slate (`#f8fafc`) with dark slate text; toggled instantly, persisted in `localStorage`
- **Spring page transitions** — Cubic-bezier slide-and-fade between sections
- **Staggered card entrance** — Card grids animate with sequential delay timing
- **AI scanning radar** — Animated concentric rings and sweeping beam during fraud pre-screening
- **Biometric scanning animations** — Laser sweep, fingerprint ripple, and facial landmark mesh animations
- **Toast notifications** — Contextual success/error/info toasts with auto-dismiss
- **Google Fonts** — *Inter* for UI, *JetBrains Mono* for IDs, account numbers, and amounts

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla JavaScript (ES6+), CSS3 Custom Properties |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL 8.0+ / MariaDB 10.5+ via `mysql2/promise` |
| **Fallback Store** | JSON file-based persistent ledger (`data/ledger-store.json`) |
| **Face Recognition** | [face-api.js](https://github.com/justadudewhohacks/face-api.js) — TinyFaceDetector + FaceLandmark68Net + FaceRecognitionNet |
| **3D Graphics** | [Three.js r128](https://threejs.org/) — WebGL, Bezier flows, Orbit Controls, Raycasting |
| **Charts** | [Chart.js 4.4.0](https://www.chartjs.org/) |
| **Real-Time** | [Socket.IO 4.8.3](https://socket.io/) — WebSocket bidirectional streaming |
| **Authentication** | WebAuthn / Passkeys API (platform authenticator) + face-api.js |
| **Typography** | Google Fonts — Inter, JetBrains Mono |

---

## 📁 Repository Structure

```
secureLedger/
├── index.html              # Single Page Application — 10+ page sections
├── styles.css              # Design system: tokens, dark/light modes, animations
├── app.js                  # Main frontend controller: 3D graph, charts, biometrics, accounts
├── api.js                  # Client-side API bridge with offline fallback methods
├── data.js                 # Static seed datasets and baseline schema definitions
├── face-recognition.js     # Real face recognition engine: enrollment, verification, anti-spoof
├── server.js               # Express.js REST API server + WebSocket gateway (Port 3000)
├── db.js                   # Core double-entry ledger: accounts, transactions, alerts, journals
├── mysql-client.js         # MySQL connection pool with health check and graceful fallback
├── fraud-engine.js         # AI anomaly detection micro-engine: 8 behavioral signal scoring
├── schema.sql              # MySQL DDL schema + realistic seed data
├── package.json            # Node.js dependencies and scripts
├── .env.example            # MySQL environment variable template (copy to .env)
├── .gitignore              # Ignores: node_modules, .DS_Store, *.log, .env
├── data/
│   └── ledger-store.json   # Persistent fallback data store (auto-managed, do not edit)
└── README.md               # This file
```

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+ and npm
- (Optional) MySQL 8.0+ or MariaDB 10.5+ for full database mode

---

### Option 1: Full-Stack with MySQL (Production Mode)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mrrahim1111/secureLedger.git
   cd secureLedger
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure MySQL (optional but recommended):**
   ```bash
   cp .env.example .env
   # Edit .env with your MySQL credentials
   ```

4. **Initialize the database:**
   ```bash
   mysql -u root -p < schema.sql
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

6. **Open in browser:**
   Visit [`http://localhost:3000`](http://localhost:3000)

> **Note:** If MySQL is not configured or not running, the server starts normally and operates with the built-in fallback ledger store. No errors, no downtime.

---

### Option 2: Quick Start (No MySQL Required)

```bash
git clone https://github.com/mrrahim1111/secureLedger.git
cd secureLedger
npm install
npm start
# Open http://localhost:3000
```

The server auto-detects that MySQL is unavailable and seamlessly uses the structured persistent ledger instead.

---

### Option 3: Standalone Static Mode

Open `index.html` directly in any modern browser — no server needed. The frontend detects standalone mode and uses its built-in client-side engine automatically.

---

## 🔌 REST API Endpoints

### Auth & Biometrics
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user session |
| `POST` | `/api/auth/biometric-verify` | Face ID / Touch ID challenge verification |

### Account Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/accounts` | List all bank accounts |
| `POST` | `/api/accounts` | Open a new bank account (generates account number, card, journal entry) |
| `GET` | `/api/accounts/:id` | Get a single account's details |
| `DELETE` | `/api/accounts/:id` | Close account (403 if demo account) |
| `POST` | `/api/accounts/:id/switch` | Switch the active banking session |

### Transactions & Fraud
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | Query transactions with `?search=`, `?risk=`, `?type=`, `?status=` filters |
| `GET` | `/api/transactions/:id` | Get a single transaction's full detail |
| `POST` | `/api/transactions/screen` | Pre-screen a transaction for AI risk (non-committing) |
| `POST` | `/api/transactions/send` | Execute atomic double-entry payment transaction |

### Alerts & Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/alerts` | Retrieve all fraud alerts |
| `POST` | `/api/alerts/:id/action` | Analyst action: `normal`, `fraud`, or `block` |
| `GET` | `/api/analytics` | Financial volume, risk distribution, category breakdown |
| `GET` | `/api/network` | 3D graph nodes and edge vectors |
| `GET` | `/api/ledger/journal` | Full double-entry journal audit trail |
| `GET` | `/api/health` | Server health and WebSocket client count |

---

## 🎮 Complete Demo Walkthrough

### Step 1 — Login with Face ID
1. Open [`http://localhost:3000`](http://localhost:3000)
2. Select the **Rahim** account card
3. Click **Face ID** — allow camera access when prompted
4. If first time: click **"Enroll My Face Now"** → look straight at the camera for ~5 seconds
5. Once enrolled: the system auto-recognizes and logs you in

### Step 2 — Add a New Bank Account
1. On the login screen, click **"+ Add Account"** in the top-right of the account selector
2. Fill in the modal: name, account type, initial deposit
3. Click **"Open Account"** — the new card appears immediately with its account number and balance
4. Enroll Face ID for the new account by clicking its card → Face ID → Enroll

### Step 3 — Trigger AI Fraud Detection
1. Go to **Payments** in the dashboard
2. Select recipient: **Unknown Offshore Wallet**
3. Enter amount: **₹75,000**
4. Click **Review Payment** → watch the AI radar scan
5. Click **Confirm Payment** → the transaction is flagged as HIGH RISK and held for review
6. A real-time fraud alert fires to all connected browser sessions via WebSocket

### Step 4 — Investigate in 3D
1. Go to **Alerts** tab
2. Click on alert `ALT001` → click **Open Investigation**
3. The 3D sub-graph renders showing the money laundering chain:
   `TechCorp Payroll → Rahim → Unknown Offshore Wallet → Crypto P2P Desk`
4. Use analyst buttons to **Confirm Fraud** or **Mark Normal**

### Step 5 — Explore the Network Graph
1. Go to **Dashboard** — the 3D graph auto-rotates
2. Drag to orbit, scroll to zoom
3. Click the red **"Unknown Offshore Wallet"** node — edges highlight, account detail card appears below
4. Click **Toggle Auto-Rotate** or **Reset Camera** using the controls

### Step 6 — Remove a Custom Account
1. Return to the login screen (logout)
2. Click the red **"✕"** on any custom account you created
3. Confirm the prompt — account is permanently removed
4. Demo accounts (Rahim & Arjun) cannot be deleted

---

## 🔐 Security Architecture

| Layer | Implementation |
|---|---|
| **Face Liveness** | Live webcam video texture required — photos and video replays fail the embedding consistency check |
| **Consecutive Frame Lock** | 2 matching frames in sequence before unlock — prevents single-frame spoofing |
| **Per-Account Face Templates** | Face enrolled on Account A cannot unlock Account B |
| **Demo Account Protection** | `is_demo: true` flag blocks deletion at API and database layer (HTTP 403) |
| **Biometric Data Locality** | All face templates stored only in browser `localStorage` — never transmitted |
| **WebAuthn Hardware Keys** | Touch ID credentials stored in device secure enclave — not exportable |
| **Double-Entry Invariants** | Every balance change requires corresponding journal entry; high-risk transactions are held, not applied |
| **VPN Detection** | AI engine flags anonymizing routing as a risk signal |
| **Device Fingerprinting** | Rooted/emulated device environments flagged in fraud scoring |
| **Environment Variable Secrets** | DB credentials read from `.env` (gitignored) — never committed to source control |

---

## 🧪 Verification Checklist

```
✓ node --check app.js                → Syntax OK
✓ node --check face-recognition.js   → Syntax OK
✓ node --check db.js                 → Syntax OK
✓ node --check server.js             → Syntax OK
✓ node --check mysql-client.js       → Syntax OK

✓ GET  /api/health                   → { status: "ok", ledgerBalanced: true }
✓ GET  /api/accounts                 → Returns Rahim, Arjun Sharma, Priya Nair
✓ POST /api/accounts                 → Creates account with SLAC number, card, opening deposit
✓ DELETE /api/accounts/USR001        → HTTP 403 — Demo account protected
✓ DELETE /api/accounts/USR006        → HTTP 200 — Custom account deleted
✓ POST /api/transactions/screen      → Returns AI risk score and reasons
✓ POST /api/transactions/send        → Executes double-entry payment, broadcasts via WebSocket
```

---

## 📦 Dependencies

```json
{
  "express": "^4.19.2",
  "cors": "^2.8.5",
  "socket.io": "^4.8.3",
  "mysql2": "^3.x",
  "dotenv": "^16.x"
}
```

CDN Libraries (loaded in `index.html`):
- `face-api.js` — jsDelivr CDN (browser neural network inference)
- `Three.js r128` — 3D WebGL graphics
- `Chart.js 4.4.0` — Data visualization
- `Socket.IO client` — WebSocket real-time sync

---

## 👤 Author

**Rahim** — [@mrrahim1111](https://github.com/mrrahim1111)

🔗 **Repository:** [https://github.com/mrrahim1111/secureLedger](https://github.com/mrrahim1111/secureLedger)

---

## 📜 License

MIT License — Free to use for educational, academic, and portfolio purposes.