'use client';
import { useState, useEffect } from 'react';
import { observerAPI } from '@/lib/api';

type View = 'landing' | 'login' | 'register' | 'pending' | 'pay' | 'dashboard';

const TIERS = [
  { key: 'individual', name: 'Individual', price: '$500', seats: '1 seat', target: 'Freelance / accredited observers', features: ['Real-time PU results', 'Evidence viewer', 'Parallel count', 'Alerts', 'CSV/PDF export'] },
  { key: 'organization', name: 'Organization', price: '$2,000', seats: '5 seats', target: 'Domestic observer orgs', features: ['Everything in Individual', 'Team seats (5)', 'Seat management', 'Priority support'] },
  { key: 'enterprise', name: 'Enterprise', price: '$10,000', seats: '20 seats', target: 'International missions', features: ['Everything in Organization', 'Team seats (20)', 'Dedicated support', 'Custom jurisdiction filters'] },
];

export default function ObserverHome() {
  const [view, setView] = useState<View>('landing');
  const [token, setToken] = useState<string | null>(null);
  const [observer, setObserver] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem('obs_token');
    if (t) { setToken(t); checkStatus(); }
  }, []);

  const checkStatus = async () => {
    const data = await observerAPI.getMe();
    if (Array.isArray(data) && data.length > 0) {
      const obs = data[0];
      setObserver(obs);
      if (obs.status === 'observer_active') setView('dashboard');
      else if (obs.status === 'observer_approved') setView('pay');
      else if (obs.status === 'observer_pending') setView('pending');
      else setView('register');
    } else if (data.statusCode === 401) {
      setView('landing');
    } else {
      // Logged in but no observer record — go to observer registration
      setView('register');
    }
  };

  if (view === 'landing') return <LandingPage onLogin={() => setView('login')} onRegister={() => setView('register')} />;
  if (view === 'login') return <LoginPage onSuccess={() => { checkStatus(); }} onBack={() => setView('landing')} />;
  if (view === 'register') return <RegisterPage onSuccess={() => { checkStatus(); }} onBack={() => setView('landing')} />;
  if (view === 'pending') return <PendingPage />;
  if (view === 'pay') return <PayPage observer={observer} onSuccess={() => checkStatus()} />;
  if (view === 'dashboard') return <DashboardRedirect observer={observer} />;

  return null;
}

// === Landing/Pricing ===
function LandingPage({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <div className="min-h-screen bg-[#0F172A]">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">🗳️ ReportAfrica <span className="text-emerald-400">Observers</span></h1>
        <div className="flex gap-3">
          <button onClick={onLogin} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">Log In</button>
          <button onClick={onRegister} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition">Get Access</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Real-Time Election Intelligence</h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12">Powered by citizen reporters across Africa. Get live PU results, photo evidence, verification signals, and parallel vote tabulation — as it happens.</p>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {TIERS.map(t => (
            <div key={t.key} className="bg-[#1E293B] rounded-2xl border border-gray-700 p-6 text-left hover:border-emerald-500 transition">
              <p className="text-sm text-emerald-400 font-semibold">{t.target}</p>
              <h3 className="text-2xl font-bold text-white mt-2">{t.name}</h3>
              <p className="text-3xl font-bold text-emerald-400 mt-2">{t.price}</p>
              <p className="text-xs text-gray-500 mt-1">90 days · {t.seats} · per country</p>
              <ul className="mt-4 space-y-2">
                {t.features.map(f => <li key={f} className="text-sm text-gray-300 flex items-center gap-2"><span className="text-emerald-400">✓</span>{f}</li>)}
              </ul>
              <button onClick={onRegister} className="w-full mt-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition">Get Started</button>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-4 gap-6 text-left">
          {[
            { icon: '📊', title: 'Live Parallel Count', desc: 'Auto-calculated party totals per state/LGA as results come in' },
            { icon: '📸', title: 'Evidence Viewer', desc: 'Photos & videos of result sheets from every polling unit' },
            { icon: '🚨', title: 'Integrity Alerts', desc: 'Instant notifications for over-voting, disputes, mass uploads' },
            { icon: '🔒', title: 'Hash Chain Verification', desc: 'Every result is sealed with SHA-256, linked in tamper-proof chain' },
          ].map(f => (
            <div key={f.title} className="bg-[#1E293B] rounded-xl p-5 border border-gray-700">
              <p className="text-2xl mb-2">{f.icon}</p>
              <h4 className="text-sm font-semibold text-white">{f.title}</h4>
              <p className="text-xs text-gray-400 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === Login ===
function LoginPage({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError('');
    const data = await observerAPI.login(email, password);
    if (data.token) { localStorage.setItem('obs_token', data.token); onSuccess(); }
    else setError(data.message || 'Login failed');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="bg-[#1E293B] rounded-2xl border border-gray-700 p-8 w-full max-w-md">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white mb-4">← Back</button>
        <h2 className="text-xl font-bold text-white mb-6">Log in to Observer Dashboard</h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full mb-3 px-4 py-3 bg-[#0F172A] border border-gray-600 rounded-lg text-white text-sm outline-none" />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full mb-4 px-4 py-3 bg-[#0F172A] border border-gray-600 rounded-lg text-white text-sm outline-none" />
        <button onClick={handleLogin} disabled={loading} className="w-full py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition">
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </div>
    </div>
  );
}

// === Register (with accreditation upload) ===
function RegisterPage({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('obs_token');
  const [step, setStep] = useState<'account' | 'observer'>(hasToken ? 'observer' : 'account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('NG');
  const [tier, setTier] = useState('individual');
  const [accreditationUrl, setAccreditationUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    setLoading(true); setError('');
    const data = await observerAPI.register({ email, password, displayName, username: email.split('@')[0], country });
    if (data.token) { localStorage.setItem('obs_token', data.token); setStep('observer'); }
    else if (data.message?.includes('exists')) {
      // Try login
      const login = await observerAPI.login(email, password);
      if (login.token) { localStorage.setItem('obs_token', login.token); setStep('observer'); }
      else setError(login.message || 'Account exists, login failed');
    } else setError(data.message || 'Registration failed');
    setLoading(false);
  };

  const handleRegisterObserver = async () => {
    if (!accreditationUrl) { setError('Upload your accreditation document'); return; }
    setLoading(true); setError('');
    const data = await observerAPI.registerObserver({ orgName: orgName || undefined, country, tier, accreditationUrl });
    if (data.id) onSuccess();
    else setError(data.message || 'Registration failed');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="bg-[#1E293B] rounded-2xl border border-gray-700 p-8 w-full max-w-md">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white mb-4">← Back</button>
        <h2 className="text-xl font-bold text-white mb-2">Get Observer Access</h2>
        <p className="text-gray-400 text-sm mb-6">{step === 'account' ? 'Step 1: Create account' : 'Step 2: Observer registration'}</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {step === 'account' ? (
          <>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full Name" className="w-full mb-3 px-4 py-3 bg-[#0F172A] border border-gray-600 rounded-lg text-white text-sm outline-none" />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full mb-3 px-4 py-3 bg-[#0F172A] border border-gray-600 rounded-lg text-white text-sm outline-none" />
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full mb-4 px-4 py-3 bg-[#0F172A] border border-gray-600 rounded-lg text-white text-sm outline-none" />
            <button onClick={handleCreateAccount} disabled={loading} className="w-full py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition">
              {loading ? 'Creating...' : 'Continue'}
            </button>
          </>
        ) : (
          <>
            <select value={tier} onChange={e => setTier(e.target.value)} className="w-full mb-3 px-4 py-3 bg-[#0F172A] border border-gray-600 rounded-lg text-white text-sm outline-none">
              <option value="individual">Individual — $500 (1 seat)</option>
              <option value="organization">Organization — $2,000 (5 seats)</option>
              <option value="enterprise">Enterprise — $10,000 (20 seats)</option>
            </select>
            <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Organization name (optional for individual)" className="w-full mb-3 px-4 py-3 bg-[#0F172A] border border-gray-600 rounded-lg text-white text-sm outline-none" />
            <select value={country} onChange={e => setCountry(e.target.value)} className="w-full mb-3 px-4 py-3 bg-[#0F172A] border border-gray-600 rounded-lg text-white text-sm outline-none">
              <option value="NG">Nigeria</option>
              <option value="GH">Ghana</option>
              <option value="KE">Kenya</option>
              <option value="ZA">South Africa</option>
              <option value="TZ">Tanzania</option>
              <option value="UG">Uganda</option>
              <option value="SN">Senegal</option>
              <option value="RW">Rwanda</option>
            </select>
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-2">Accreditation Document (paste URL or upload link)</label>
              <input value={accreditationUrl} onChange={e => setAccreditationUrl(e.target.value)} placeholder="https://... (PDF or image link)" className="w-full px-4 py-3 bg-[#0F172A] border border-gray-600 rounded-lg text-white text-sm outline-none" />
            </div>
            <button onClick={handleRegisterObserver} disabled={loading} className="w-full py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition">
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// === Pending state ===
function PendingPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="bg-[#1E293B] rounded-2xl border border-gray-700 p-8 w-full max-w-md text-center">
        <p className="text-4xl mb-4">⏳</p>
        <h2 className="text-xl font-bold text-white mb-2">Application Under Review</h2>
        <p className="text-gray-400 text-sm">Your accreditation is being verified. You'll be notified once approved — typically within 1-2 hours during election periods.</p>
        <button onClick={() => { localStorage.removeItem('obs_token'); window.location.reload(); }} className="mt-6 text-sm text-gray-500 hover:text-white transition">Log out</button>
      </div>
    </div>
  );
}

// === Payment page ===
function PayPage({ observer, onSuccess }: { observer: any; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const tierNames: Record<string, string> = { individual: '$500', organization: '$2,000', enterprise: '$10,000' };

  const handlePay = async () => {
    setLoading(true);
    const email = prompt('Enter your email for payment receipt:');
    if (!email) { setLoading(false); return; }
    const data = await observerAPI.pay(observer.country, email);
    if (data.authorizationUrl) window.location.href = data.authorizationUrl;
    else alert(data.message || 'Payment failed');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="bg-[#1E293B] rounded-2xl border border-gray-700 p-8 w-full max-w-md text-center">
        <p className="text-4xl mb-4">✅</p>
        <h2 className="text-xl font-bold text-white mb-2">Approved!</h2>
        <p className="text-gray-400 text-sm mb-6">Your accreditation has been verified. Complete payment to activate your 90-day access.</p>
        <div className="bg-[#0F172A] rounded-xl p-4 mb-6 border border-gray-600">
          <p className="text-sm text-gray-400">Tier: <span className="text-white font-semibold capitalize">{observer.tier}</span></p>
          <p className="text-sm text-gray-400 mt-1">Country: <span className="text-white font-semibold">{observer.country}</span></p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{tierNames[observer.tier] || '$500'}</p>
          <p className="text-xs text-gray-500">One-time · 90 days access</p>
        </div>
        <button onClick={handlePay} disabled={loading} className="w-full py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition">
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  );
}

// === Dashboard redirect (loads the shell) ===
function DashboardRedirect({ observer }: { observer: any }) {
  useEffect(() => { window.location.href = '/overview'; }, []);
  return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><p className="text-gray-400">Loading dashboard...</p></div>;
}
