// ─────────────────────────────────────────────────────────────
// SecureLedger — High-Fidelity Realistic Banking Dataset
// Realistic Indian Merchant & Peer-to-Peer Transactions (Fictionalized Sandbox)
// ─────────────────────────────────────────────────────────────

const APP_DATA = {

  currentUser: {
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
    totalCredits: 93500,
    totalDebits: 45150,
    transactionCount: 5420,
    suspiciousCount: 2
  },

  users: [
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
  ],

  transactions: [
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
  ],

  alerts: [
    { id: 'ALT001', txnId: 'TXN1003', amount: 75000, riskScore: 95, riskLevel: 'high', sender: 'Rahim', receiver: 'Unknown Offshore Wallet', timestamp: '2026-09-23 02:31 AM', status: 'Under Review', reasons: ['Transaction amount 52× higher than average (₹1,450)', 'First-time transfer to flagged mule wallet', 'Transaction at 2:31 AM unusual hour', 'Anonymizing VPN/Proxy routing detected', 'Device fingerprint mismatch'] },
    { id: 'ALT002', txnId: 'TXN1009', amount: 42000, riskScore: 89, riskLevel: 'high', sender: 'Aman Verma', receiver: 'Suspicious Crypto P2P Desk', timestamp: '2026-09-20 11:15 PM', status: 'Under Review', reasons: ['Recipient flagged in financial cybercrime intelligence', 'Transaction initiated at 11:15 PM', 'Amount significantly higher than historical mean', 'Rooted Android environment detected'] },
    { id: 'ALT003', txnId: 'TXN1011', amount: 125000, riskScore: 98, riskLevel: 'high', sender: 'Suspicious Crypto P2P Desk', receiver: 'Unknown Offshore Wallet', timestamp: '2026-09-19 09:45 PM', status: 'Confirmed Fraud', reasons: ['Account confirmed in synthetic money mule ring', 'Virtual machine / Tor proxy network detected', 'Velocity limit exceeded with rapid structuring'] }
  ],

  monthlyData: {
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    volume: [145000, 162000, 138000, 195000, 172000, 188000],
    credits: [85000, 85000, 93500, 85000, 85000, 93500],
    debits: [32000, 28500, 39000, 31000, 34200, 45150],
    suspicious: [1, 2, 1, 4, 2, 3],
    normal: [148, 162, 142, 194, 176, 188]
  },

  categoryData: {
    labels: ['Food & Dining', 'Shopping', 'Salary & Income', 'Utilities', 'Subscriptions', 'Peer Transfers', 'Travel'],
    amounts: [3850, 12899, 93500, 2450, 649, 18820, 1380],
    colors: ['#22c55e', '#38bdf8', '#a855f7', '#eab308', '#ec4899', '#f97316', '#64748b']
  },

  riskDistribution: {
    low: 245,
    medium: 18,
    high: 6
  },

  adminStats: {
    totalCustomers: 12450,
    totalTransactions: 28921,
    suspicious: 147,
    highRisk: 32,
    confirmedFraud: 8,
    blocked: 15
  },

  liveFeed: [
    { id: 'TXN10241', amount: 450, risk: 'low', riskScore: 6, sender: 'Rahim', receiver: 'Starbucks Coffee', time: '11:45' },
    { id: 'TXN10242', amount: 620, risk: 'low', riskScore: 8, sender: 'Rahim', receiver: 'Swiggy India', time: '20:42' },
    { id: 'TXN10243', amount: 75000, risk: 'high', riskScore: 95, sender: 'Rahim', receiver: 'Unknown Offshore Wallet', time: '02:31' },
    { id: 'TXN10244', amount: 8500, risk: 'low', riskScore: 5, sender: 'Priya Nair', receiver: 'Rahim', time: '13:15' }
  ],

  networkNodes: [
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
  ],

  networkEdges: [
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
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_DATA;
}
