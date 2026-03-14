'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}
function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}
function fmt(n) { return Number(n || 0).toLocaleString('en-NG'); }

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0' }}>
      <div style={{ width:28, height:28, border:'3px solid #e5e7eb', borderTopColor:'#1f8f43', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  );
}

export default function WalletPage() {
  const [wallet, setWallet]         = useState(null);
  const [transactions, setTxns]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('all'); // all | credit | debit
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [bankCode, setBankCode]     = useState('');
  const [accountNo, setAccountNo]   = useState('');
  const [withdrawState, setWithdrawState] = useState('idle'); // idle | loading | success | error
  const [withdrawMsg, setWithdrawMsg]     = useState('');
  const [showWithdraw, setShowWithdraw]   = useState(false);

  const user = getUser();

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [wRes, tRes] = await Promise.allSettled([
        fetch(`${API}/api/wallet`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API}/api/wallet/transactions`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      if (wRes.status === 'fulfilled' && wRes.value.ok) {
        const d = await wRes.value.json();
        setWallet(d.wallet || d.data || d);
      }
      if (tRes.status === 'fulfilled' && tRes.value.ok) {
        const d = await tRes.value.json();
        setTxns(d.transactions || d.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const submitWithdrawal = async () => {
    if (!withdrawAmt || Number(withdrawAmt) < 500) {
      setWithdrawMsg('Minimum withdrawal is ₦500.'); return;
    }
    if (!accountNo || accountNo.length !== 10) {
      setWithdrawMsg('Enter a valid 10-digit account number.'); return;
    }
    if (!bankCode) {
      setWithdrawMsg('Please select your bank.'); return;
    }
    setWithdrawState('loading'); setWithdrawMsg('');
    try {
      const res = await fetch(`${API}/api/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ amount: Number(withdrawAmt), bank_code: bankCode, account_number: accountNo }),
      });
      const data = await res.json();
      if (!res.ok) { setWithdrawMsg(data.message || 'Withdrawal failed.'); setWithdrawState('error'); return; }
      setWithdrawState('success');
      setWithdrawMsg('Withdrawal request submitted! Funds arrive within 24 hours.');
      setWithdrawAmt(''); setBankCode(''); setAccountNo('');
      load(); // refresh balances
    } catch {
      setWithdrawMsg('Connection error. Please try again.');
      setWithdrawState('error');
    }
  };

  const filtered = tab === 'all' ? transactions
    : tab === 'credit' ? transactions.filter(t => t.type === 'credit' || t.amount > 0)
    : transactions.filter(t => t.type === 'debit' || t.amount < 0);

  const BANKS = [
    { code:'044', name:'Access Bank' },
    { code:'023', name:'Citibank' },
    { code:'063', name:'Diamond Bank' },
    { code:'050', name:'Ecobank' },
    { code:'084', name:'Enterprise Bank' },
    { code:'070', name:'Fidelity Bank' },
    { code:'011', name:'First Bank' },
    { code:'214', name:'First City Monument Bank' },
    { code:'058', name:'Guaranty Trust Bank' },
    { code:'030', name:'Heritage Bank' },
    { code:'301', name:'Jaiz Bank' },
    { code:'082', name:'Keystone Bank' },
    { code:'526', name:'Moniepoint MFB' },
    { code:'076', name:'Polaris Bank' },
    { code:'101', name:'Providus Bank' },
    { code:'221', name:'Stanbic IBTC Bank' },
    { code:'068', name:'Standard Chartered' },
    { code:'232', name:'Sterling Bank' },
    { code:'100', name:'Suntrust Bank' },
    { code:'032', name:'Union Bank' },
    { code:'033', name:'United Bank for Africa' },
    { code:'215', name:'Unity Bank' },
    { code:'035', name:'Wema Bank' },
    { code:'057', name:'Zenith Bank' },
    { code:'565', name:'Carbon' },
    { code:'50211', name:'Kuda Bank' },
    { code:'90115', name:'OPay' },
    { code:'90110', name:'PalmPay' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f7f8fa; color:#1f2937; }
        a { color:inherit; text-decoration:none; }
        button { font-family:'Inter',sans-serif; cursor:pointer; border:none; }
        input, select { font-family:'Inter',sans-serif; }

        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }

        .page-wrap { max-width:900px; margin:0 auto; padding:36px 24px 80px; animation:fadeUp 0.4s ease both; }
        .page-title { font-size:1.5rem; font-weight:900; color:#111; letter-spacing:-0.04em; margin-bottom:6px; }
        .page-sub   { font-size:0.85rem; color:#9ca3af; margin-bottom:28px; }

        /* BALANCE GRID */
        .balance-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:28px; }
        .bal-card { border-radius:20px; padding:22px 24px; position:relative; overflow:hidden; }
        .bal-card.main { background:linear-gradient(135deg,#0d3320,#1f8f43); color:#fff; }
        .bal-card.pending { background:#fff; border:1px solid #eceff3; }
        .bal-card.earned  { background:#fff; border:1px solid #eceff3; }
        .bal-label { font-size:0.72rem; font-weight:700; opacity:0.8; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:8px; }
        .bal-amount { font-size:1.7rem; font-weight:900; letter-spacing:-0.04em; }
        .bal-card.main .bal-label  { color:rgba(255,255,255,0.7); }
        .bal-card.main .bal-amount { color:#fff; }
        .bal-card.pending .bal-label  { color:#9ca3af; }
        .bal-card.pending .bal-amount { color:#f59e0b; }
        .bal-card.earned  .bal-label  { color:#9ca3af; }
        .bal-card.earned  .bal-amount { color:#1f8f43; }
        .bal-card.main::after {
          content:''; position:absolute; top:-30px; right:-30px;
          width:120px; height:120px; border-radius:50%;
          background:rgba(255,255,255,0.06);
        }
        .bal-sub { font-size:0.72rem; margin-top:4px; opacity:0.7; }

        /* WITHDRAW CARD */
        .withdraw-card { background:#fff; border:1px solid #eceff3; border-radius:20px; padding:22px 24px; margin-bottom:24px; box-shadow:0 4px 16px rgba(15,23,42,0.05); }
        .withdraw-form { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:18px; animation:slideDown 0.25s ease both; }
        .form-group label { display:block; font-size:0.75rem; font-weight:700; color:#374151; margin-bottom:6px; }
        .form-input { width:100%; padding:11px 14px; border:1.5px solid #e5e7eb; border-radius:11px; font-size:0.875rem; color:#111; outline:none; background:#fafafa; transition:border-color 0.2s; }
        .form-input:focus { border-color:#1f8f43; background:#fff; box-shadow:0 0 0 3px rgba(31,143,67,0.08); }
        .form-input.full { grid-column:1/-1; }
        select.form-input { cursor:pointer; }

        /* MAIN BTN */
        .primary-btn { padding:13px 22px; border-radius:12px; background:#1f8f43; color:#fff; font-size:0.9rem; font-weight:800; box-shadow:0 6px 18px rgba(31,143,67,0.2); transition:all 0.2s; display:inline-flex; align-items:center; gap:8px; }
        .primary-btn:hover:not(:disabled) { background:#187536; transform:translateY(-1px); }
        .primary-btn:disabled { opacity:0.65; cursor:not-allowed; transform:none; }
        .outline-btn { padding:13px 22px; border-radius:12px; background:#f3f4f6; color:#374151; font-size:0.9rem; font-weight:700; transition:all 0.2s; }
        .outline-btn:hover { background:#e5e7eb; }
        .btn-spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.65s linear infinite; }

        /* TRANSACTIONS */
        .txn-card { background:#fff; border:1px solid #eceff3; border-radius:20px; padding:22px 24px; box-shadow:0 4px 16px rgba(15,23,42,0.05); }
        .tab-bar { display:flex; gap:6px; margin-bottom:20px; }
        .tab-pill { padding:8px 16px; border-radius:50px; font-size:0.82rem; font-weight:700; background:#f3f4f6; color:#6b7280; cursor:pointer; transition:all 0.18s; border:none; }
        .tab-pill.active { background:#1f8f43; color:#fff; }

        /* TXN ROW */
        .txn-row { display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid #f3f4f6; }
        .txn-row:last-child { border-bottom:none; }
        .txn-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .txn-icon.credit { background:#eaf8ee; }
        .txn-icon.debit  { background:#fef2f2; }
        .txn-desc { flex:1; min-width:0; }
        .txn-title { font-size:0.875rem; font-weight:700; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .txn-date  { font-size:0.72rem; color:#9ca3af; margin-top:2px; }
        .txn-amount { font-size:0.95rem; font-weight:900; flex-shrink:0; }
        .txn-amount.credit { color:#1f8f43; }
        .txn-amount.debit  { color:#ef4444; }

        /* STATUS BADGE */
        .status-pill { display:inline-block; padding:3px 9px; border-radius:50px; font-size:0.65rem; font-weight:800; margin-left:6px; }

        @media (max-width:700px) {
          .balance-grid { grid-template-columns:1fr; }
          .withdraw-form { grid-template-columns:1fr; }
          .form-input.full { grid-column:auto; }
        }
        @media (max-width:480px) { .page-wrap { padding:20px 16px 60px; } }
      `}</style>

      <Nav />

      <div className="page-wrap">
        <div className="page-title">My Wallet</div>
        <div className="page-sub">Manage your AfriPlate earnings and withdrawals</div>

        {loading ? <Spinner /> : (
          <>
            {/* BALANCE CARDS */}
            <div className="balance-grid">
              <div className="bal-card main">
                <div className="bal-label">Available Balance</div>
                <div className="bal-amount">₦{fmt(wallet?.balance || wallet?.available_balance || 0)}</div>
                <div className="bal-sub">Ready to withdraw</div>
              </div>
              <div className="bal-card pending">
                <div className="bal-label">Pending Balance</div>
                <div className="bal-amount">₦{fmt(wallet?.pending_balance || 0)}</div>
                <div className="bal-sub" style={{ color:'#9ca3af' }}>Released after delivery</div>
              </div>
              <div className="bal-card earned">
                <div className="bal-label">Total Earned</div>
                <div className="bal-amount">₦{fmt(wallet?.total_earned || 0)}</div>
                <div className="bal-sub" style={{ color:'#9ca3af' }}>All time</div>
              </div>
            </div>

            {/* WITHDRAW */}
            <div className="withdraw-card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:'1rem', fontWeight:900, color:'#111', marginBottom:3 }}>Withdraw Funds</div>
                  <div style={{ fontSize:'0.78rem', color:'#9ca3af' }}>Minimum withdrawal: ₦500 · Arrives within 24 hours</div>
                </div>
                <button
                  className={showWithdraw ? 'outline-btn' : 'primary-btn'}
                  onClick={() => { setShowWithdraw(s => !s); setWithdrawMsg(''); setWithdrawState('idle'); }}
                >
                  {showWithdraw ? 'Cancel' : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                      Withdraw
                    </>
                  )}
                </button>
              </div>

              {showWithdraw && (
                <div>
                  <div className="withdraw-form">
                    <div className="form-group">
                      <label>Amount (₦)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 5000"
                        value={withdrawAmt}
                        onChange={e => setWithdrawAmt(e.target.value)}
                        min="500"
                        max={wallet?.balance || 0}
                      />
                    </div>
                    <div className="form-group">
                      <label>Bank</label>
                      <select className="form-input" value={bankCode} onChange={e => setBankCode(e.target.value)}>
                        <option value="">Select bank</option>
                        {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group full">
                      <label>Account Number</label>
                      <input
                        type="text"
                        className="form-input full"
                        placeholder="10-digit account number"
                        value={accountNo}
                        onChange={e => setAccountNo(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {withdrawMsg && (
                    <div style={{
                      marginTop:12, padding:'11px 14px', borderRadius:10, fontSize:'0.82rem', fontWeight:600,
                      background: withdrawState === 'success' ? '#eaf8ee' : '#fef2f2',
                      border: `1px solid ${withdrawState === 'success' ? '#bbf7d0' : '#fecaca'}`,
                      color: withdrawState === 'success' ? '#1f8f43' : '#dc2626',
                    }}>{withdrawMsg}</div>
                  )}

                  <div style={{ marginTop:16, display:'flex', gap:10 }}>
                    <button
                      className="primary-btn"
                      onClick={submitWithdrawal}
                      disabled={withdrawState === 'loading'}
                    >
                      {withdrawState === 'loading' ? <><span className="btn-spinner" /> Processing...</> : 'Submit Withdrawal'}
                    </button>
                    {withdrawAmt && (
                      <div style={{ display:'flex', alignItems:'center', fontSize:'0.82rem', color:'#6b7280' }}>
                        You'll receive <strong style={{ color:'#111', margin:'0 4px' }}>₦{fmt(Number(withdrawAmt) || 0)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* TRANSACTIONS */}
            <div className="txn-card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ fontSize:'1rem', fontWeight:900, color:'#111' }}>Transaction History</div>
                <div className="tab-bar">
                  {['all','credit','debit'].map(t => (
                    <button key={t} className={`tab-pill ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5" style={{ marginBottom:10 }}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  <p style={{ fontWeight:600, fontSize:'0.875rem' }}>No transactions yet</p>
                </div>
              ) : filtered.map(txn => {
                const isCredit = txn.type === 'credit' || txn.amount > 0;
                const date = txn.created_at
                  ? new Date(txn.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })
                  : '';
                return (
                  <div key={txn.id} className="txn-row">
                    <div className={`txn-icon ${isCredit ? 'credit' : 'debit'}`}>
                      {isCredit
                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f8f43" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                      }
                    </div>
                    <div className="txn-desc">
                      <div className="txn-title">
                        {txn.description || (isCredit ? 'Payment received' : 'Withdrawal')}
                        {txn.status && txn.status !== 'completed' && (
                          <span className="status-pill" style={{
                            background: txn.status === 'pending' ? '#fef3c7' : '#fef2f2',
                            color: txn.status === 'pending' ? '#d97706' : '#ef4444',
                          }}>{txn.status}</span>
                        )}
                      </div>
                      <div className="txn-date">{date}</div>
                    </div>
                    <div className={`txn-amount ${isCredit ? 'credit' : 'debit'}`}>
                      {isCredit ? '+' : '-'}₦{fmt(Math.abs(txn.amount))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Nav() {
  const user = getUser();
  return (
    <nav style={{
      background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 24px',
      height:62, display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:100, fontFamily:'Inter,sans-serif',
    }}>
      <a href="/" style={{ fontSize:'1.45rem', fontWeight:900, color:'#111', letterSpacing:'-0.04em' }}>
        Afri<span style={{ color:'#1f8f43' }}>Plate</span>
      </a>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <a href="/products" style={{ padding:'8px 14px', borderRadius:10, fontSize:'0.84rem', fontWeight:700, color:'#374151', background:'#f3f4f6' }}>Products</a>
        <a href="/services" style={{ padding:'8px 14px', borderRadius:10, fontSize:'0.84rem', fontWeight:700, color:'#374151', background:'#f3f4f6' }}>Services</a>
        <a href="/jobs"     style={{ padding:'8px 14px', borderRadius:10, fontSize:'0.84rem', fontWeight:700, color:'#374151', background:'#f3f4f6' }}>Jobs</a>
        {user
          ? <a href="/dashboard" style={{ padding:'8px 16px', borderRadius:10, fontSize:'0.84rem', fontWeight:800, color:'#fff', background:'#1f8f43' }}>Dashboard</a>
          : <a href="/login"     style={{ padding:'8px 16px', borderRadius:10, fontSize:'0.84rem', fontWeight:800, color:'#fff', background:'#1f8f43' }}>Sign In</a>
        }
      </div>
    </nav>
  );
}