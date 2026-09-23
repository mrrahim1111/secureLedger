// SecureLedger - Fictional Data Layer
// All data is simulated for college project demonstration purposes only.

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
    balance: 25430,
    creditScore: 742,
    riskProfile: 'Low',
    totalCredits: 42000,
    totalDebits: 18570,
    transactionCount: 5420,
    suspiciousCount: 21
  },

  users: [
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
  ],

  transactions: [
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
    { id: 'TXN1012', date: '2026-09-19', time: '21:45', sender: 'High-Risk Account', senderAcc: 'SLAC000009', receiver: 'Unknown Account', receiverAcc: 'SLAC000008', amount: 125000, type: 'Debit', category: 'Transfer', risk: 'high', riskScore: 97, status: 'Blocked', location: 'Multiple', device: 'Rooted Android', method: 'IMPS Sim', note: '' },
    { id: 'TXN1013', date: '2026-09-19', time: '15:10', sender: 'Priya', senderAcc: 'SLAC000003', receiver: 'Merchant B', receiverAcc: 'SLAC000007', amount: 3200, type: 'Debit', category: 'Travel', risk: 'low', riskScore: 14, status: 'Completed', location: 'Bangalore', device: 'Samsung Galaxy S24', method: 'UPI Sim', note: 'Flight tickets' },
    { id: 'TXN1014', date: '2026-09-18', time: '12:00', sender: 'Rahim', senderAcc: 'SLAC000001', receiver: 'Merchant A', receiverAcc: 'SLAC000006', amount: 1500, type: 'Debit', category: 'Education', risk: 'low', riskScore: 7, status: 'Completed', location: 'Kakinada', device: 'iPhone 15 Pro', method: 'UPI Sim', note: 'Online course' },
    { id: 'TXN1015', date: '2026-09-18', time: '03:22', sender: 'Aman', senderAcc: 'SLAC000004', receiver: 'Unknown Account', receiverAcc: 'SLAC000008', amount: 18000, type: 'Debit', category: 'Transfer', risk: 'high', riskScore: 79, status: 'Review', location: 'Delhi', device: 'Unknown Device', method: 'IMPS Sim', note: '' }
  ],

  alerts: [
    { id: 'ALT001', txnId: 'TXN1003', amount: 75000, riskScore: 91, riskLevel: 'high', sender: 'Rahim', receiver: 'Unknown Account', timestamp: '2026-09-23 02:31 AM', status: 'Under Review', reasons: ['Transaction amount 50× higher than average (₹1,500)', 'New beneficiary - first-time transfer', 'Transaction at 2:31 AM (unusual time)', 'Transaction from unknown IP/VPN location', 'Device fingerprint mismatch'] },
    { id: 'ALT002', txnId: 'TXN1009', amount: 42000, riskScore: 87, riskLevel: 'high', sender: 'Aman', receiver: 'High-Risk Account', timestamp: '2026-09-20 11:15 PM', status: 'Under Review', reasons: ['Recipient account flagged as high-risk', 'Transaction at 11:15 PM', 'Amount significantly above average', 'VPN/Proxy detected during transaction'] },
    { id: 'ALT003', txnId: 'TXN1012', amount: 125000, riskScore: 97, riskLevel: 'high', sender: 'High-Risk Account', receiver: 'Unknown Account', timestamp: '2026-09-19 09:45 PM', status: 'Confirmed Fraud', reasons: ['Account flagged as high-risk', 'Transaction to flagged unknown account', 'Rooted device detected', 'Multiple rapid transactions', 'Amount exceeds daily limit pattern'] },
    { id: 'ALT004', txnId: 'TXN1015', amount: 18000, riskScore: 79, riskLevel: 'medium', sender: 'Aman', receiver: 'Unknown Account', timestamp: '2026-09-18 03:22 AM', status: 'Under Review', reasons: ['Transaction at 3:22 AM', 'Unknown device', 'Recipient flagged as suspicious', 'Rapid consecutive transactions detected'] },
    { id: 'ALT005', txnId: 'TXN0987', amount: 8500, riskScore: 52, riskLevel: 'medium', sender: 'Merchant B', receiver: 'Unknown Account', timestamp: '2026-09-17 06:12 PM', status: 'False Positive', reasons: ['Slightly above average amount', 'New recipient account'] },
  ],

  monthlyData: {
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    volume: [145000, 162000, 138000, 195000, 172000, 188000],
    credits: [42000, 58000, 35000, 72000, 48000, 42000],
    debits: [18000, 24000, 19000, 31000, 22000, 18570],
    suspicious: [3, 5, 2, 8, 6, 3],
    normal: [142, 158, 136, 187, 166, 182]
  },

  categoryData: {
    labels: ['Food', 'Shopping', 'Travel', 'Bills', 'Education', 'Transfers', 'Other'],
    amounts: [8400, 21200, 12600, 15800, 4500, 68000, 9200],
    colors: ['#22c55e', '#f4f4f5', '#eab308', '#a1a1aa', '#71717a', '#ec4899', '#3f3f46']
  },

  riskDistribution: {
    low: 189,
    medium: 14,
    high: 7
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
    { id: 'TXN10231', amount: 850, risk: 'low', riskScore: 9, sender: 'Priya', receiver: 'Merchant A', time: '14:58' },
    { id: 'TXN10232', amount: 4500, risk: 'low', riskScore: 16, sender: 'Arjun', receiver: 'Merchant B', time: '14:57' },
    { id: 'TXN10233', amount: 75000, risk: 'high', riskScore: 91, sender: 'Rahim', receiver: 'Unknown Account', time: '02:31' },
    { id: 'TXN10234', amount: 42000, risk: 'medium', riskScore: 67, sender: 'Aman', receiver: 'High-Risk Account', time: '14:55' },
    { id: 'TXN10235', amount: 1200, risk: 'low', riskScore: 8, sender: 'Neha', receiver: 'Merchant A', time: '14:54' },
    { id: 'TXN10236', amount: 28000, risk: 'low', riskScore: 5, sender: 'Company Payroll', receiver: 'Neha', time: '14:52' },
    { id: 'TXN10237', amount: 19500, risk: 'medium', riskScore: 54, sender: 'Merchant B', receiver: 'Unknown Account', time: '14:51' },
    { id: 'TXN10238', amount: 650, risk: 'low', riskScore: 7, sender: 'Arjun', receiver: 'Priya', time: '14:49' },
  ],

  networkNodes: [
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
  ],

  networkEdges: [
    { from: 'n1', to: 'n2', amount: 500, risk: 'low', id: 'TXN1001' },
    { from: 'n10', to: 'n1', amount: 30000, risk: 'low', id: 'TXN1002' },
    { from: 'n1', to: 'n8', amount: 75000, risk: 'high', id: 'TXN1003' },
    { from: 'n1', to: 'n6', amount: 1200, risk: 'low', id: 'TXN1004' },
    { from: 'n3', to: 'n1', amount: 3500, risk: 'low', id: 'TXN1005' },
    { from: 'n1', to: 'n7', amount: 850, risk: 'low', id: 'TXN1006' },
    { from: 'n4', to: 'n9', amount: 42000, risk: 'high', id: 'TXN1009' },
    { from: 'n5', to: 'n6', amount: 6700, risk: 'low', id: 'TXN1010' },
    { from: 'n10', to: 'n2', amount: 28000, risk: 'low', id: 'TXN1011' },
    { from: 'n9', to: 'n8', amount: 125000, risk: 'high', id: 'TXN1012' },
    { from: 'n3', to: 'n7', amount: 3200, risk: 'low', id: 'TXN1013' },
    { from: 'n4', to: 'n8', amount: 18000, risk: 'high', id: 'TXN1015' }
  ]
};
