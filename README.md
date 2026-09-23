# 🛡️ SecureLedger — AI-Powered Digital Banking & Fraud Screening

> **College Project Prototype** — A high-fidelity web application demonstrating simulated digital banking combined with an artificial intelligence fraud-screening engine, 3D transaction network graph, and behavioral anomaly detection.

---

## 📌 Project Overview

**SecureLedger** is an interactive web-based fintech prototype built to showcase how modern digital banking platforms can integrate explainable AI risk scoring to detect fraudulent behavior in real time.

The system analyzes simulated transactions based on multiple anomaly vectors (amount spikes, time-of-day, new beneficiaries, device fingerprints, and geolocation anomalies), assigns a 0–100 risk score, and presents the entire banking network in interactive 3D.

> ⚠️ **Disclaimer:** All accounts, transactions, balances, and user profiles are entirely fictional for academic demonstration purposes. No real banking APIs, payment gateways, or real money are involved.

---

## ✨ Key Features

### 1. 🤖 AI Fraud Screening Engine
- **Real-Time Risk Scoring:** Analyzes transactions as they are submitted and assigns a score from `0` (Safe) to `100` (High Risk Fraud).
- **Explainable Fraud Alerts:** Provides human-readable reasoning (e.g., *"Amount 50× higher than user average"*, *"VPN/Proxy detected"*, *"Transaction at 2:31 AM"*).
- **Inline Risk Interception:** Intercepts high-risk transactions before execution and presents a security review modal with radar scan animations.

### 2. 🕸️ 3D Transaction Network Graph (Three.js WebGL)
- **Interactive Graph Visualization:** Renders accounts as 3D spherical nodes with color-coded risk highlights (Green = Low, Amber = Medium, Red = High).
- **Curved Money Flow Edges:** Quadratic Bezier curves with directional cone arrows showing flow of funds between accounts.
- **Node Focus & Detail Drilldown:** Clicking any 3D node isolates its transaction edges and displays an interactive account card below the canvas.
- **Camera Orbit Controls:** Full drag-to-rotate, scroll-to-zoom, auto-rotation toggle, and camera reset buttons.

### 3. 📊 Analytics & Behavioral Intelligence (Chart.js)
- **Financial Volume Charts:** Credit vs. Debit monthly comparative bar charts.
- **Suspicious Transaction Trends:** Time-series line chart tracking normal vs. flagged activity.
- **Category & Risk Distribution:** Doughnut charts breaking down spending categories and risk levels.
- **Behavioral Comparison:** Displays a user's normal transaction baseline side-by-side with flagged transactions.

### 4. 🌓 Dual Theme System (Dark & Light Modes)
- **Monochromatic Dark Mode:** Rich dark charcoal interface (`#09090b`) with metallic silver typography.
- **Clean Slate Light Mode:** Crisp light slate theme (`#f8fafc`) with dark slate typography.
- **Instant Toggle & Persistence:** Seamless switching via topbar icon or Settings menu; automatically updates WebGL 3D canvas background and Chart.js canvas palettes.

### 5. ⚡ Micro-Animations & Design Polish
- **Spring Page Transitions:** Smooth cubic-bezier page slide-and-fade effects.
- **Staggered Entrance:** Card grids animate with sequential timing.
- **Live Scanning Radar:** Animated radar beam and moving scanlines during AI fraud analysis.
- **Interactive Card Elevation:** Cards elevate with subtle shadow depth on hover.

### 6. 🚨 Alert & Investigation Center
- **Alert Queue:** Centralized dashboard of flagged transactions sorted by severity.
- **3D Sub-Network Investigation:** Dedicated investigation console rendering only relevant sub-networks for analyst review.
- **Analyst Action Triggers:** Mark transaction normal, confirm fraud, or block account.

---

## 🛠️ Technology Stack

- **Frontend Core:** HTML5, Vanilla JavaScript (ES6+)
- **Styling:** Custom Vanilla CSS3 (CSS Variables, Flexbox, Grid, CSS Keyframe Animations)
- **3D Graphics:** [Three.js r128](https://threejs.org/) (WebGL Renderer, Orbit Controls, Raycasting)
- **Data Visualization:** [Chart.js 4.4.0](https://www.chartjs.org/)
- **Typography:** Google Fonts (*Inter* for UI, *JetBrains Mono* for IDs and currency amounts)

---

## 📁 Repository Structure

```
secureLedger/
├── index.html     # Single Page Application HTML structure (10 sections)
├── styles.css     # Design tokens, Dark/Light mode styles, CSS animations
├── app.js         # Main controller, Three.js 3D network, Chart configs, AI logic
├── data.js        # Simulated datasets (users, transactions, alerts, monthly data)
└── README.md      # Project documentation
```

---

## 🚀 How to Run Locally

Since **SecureLedger** is built as a zero-dependency client-side application using standard web APIs and CDN-hosted libraries, no `npm install` or local server build step is required!

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mrrahim1111/secureLedger.git
   cd secureLedger
   ```

2. **Open in Browser:**
   - Double click [`index.html`](index.html) to open directly in Chrome, Safari, Firefox, or Edge.
   - Or serve with any static web server:
     ```bash
     npx serve .
     ```

---

## 🎮 How to Demo the Prototype

1. **Sign In:** Use pre-filled demo credentials on the dual-pane login screen (`rahim@securledger.dev`).
2. **Explore 3D Dashboard:** Drag, rotate, and zoom the 3D transaction network graph. Click on nodes (e.g. *Unknown Acct*) to inspect account relationships.
3. **Trigger AI Fraud Alert:**
   - Go to **Payments**.
   - Select **Unknown Account** as recipient.
   - Enter **₹75,000**.
   - Click **Review Payment** → **Confirm Payment**.
   - Watch the live AI screening radar animation detect high risk and trigger an interactive fraud alert.
4. **Open Fraud Investigation:** Go to **Alerts** → click `TXN1003` → click **Open Investigation** to inspect the 3D sub-graph and take analyst actions.
5. **Toggle Themes:** Click the **Moon/Sun icon** in the top navigation bar to toggle between Dark Mode and Light Mode.

---

## 📜 License & Academic Usage

This project is created for educational and college demonstration purposes. All rights reserved.