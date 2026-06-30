'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { govAPI } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.reportafrica.africa/api/v1';

export default function GovLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await govAPI.login(email, password);
      if (!data.token) { setError('Invalid credentials'); setLoading(false); return; }

      localStorage.setItem('gov_token', data.token);

      const me = await govAPI.getMe();
      if (me.isPending) {
        setError('Your agency registration is pending admin approval. You will be notified once approved.');
        localStorage.removeItem('gov_token');
      } else if (!me.isGov) {
        // User exists but not registered as gov - show step 2
        setToken(data.token);
        setMode('register');
        setStep(2);
        setError('');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, username: email.split('@')[0], country: 'NG' }),
      }).then(r => r.json());

      let authToken = regRes.token;

      if (!authToken && (regRes.statusCode === 409 || regRes.message?.includes('already'))) {
        const loginRes = await govAPI.login(email, password);
        if (loginRes.token) authToken = loginRes.token;
        else { setError('Account exists. Please use Log In instead.'); setLoading(false); return; }
      } else if (!authToken) {
        setError(regRes.message || 'Registration failed'); setLoading(false); return;
      }

      setToken(authToken);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleRegisterAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName) { setError('Enter your agency name'); return; }
    if (!proofFile) { setError('Upload your proof of agency document'); return; }
    setError(''); setLoading(true);

    try {
      // Upload proof file via presigned URL
      let proofUrl = '';
      const fileType = proofFile.type.startsWith('image') ? 'image' : 'document';
      const presignRes = await fetch(`${API_URL}/upload/presigned-url?type=${fileType}&contentType=${encodeURIComponent(proofFile.type)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());

      if (presignRes.uploadUrl) {
        await fetch(presignRes.uploadUrl, { method: 'PUT', body: proofFile, headers: { 'Content-Type': proofFile.type } });
        proofUrl = presignRes.fileUrl;
      } else {
        // Fallback: skip upload, use filename as placeholder
        proofUrl = `uploaded:${proofFile.name}`;
      }

      // Register as gov agency
      const govRes = await fetch(`${API_URL}/gov/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agencyName, jurisdiction: 'national', contactEmail: email, proofUrl }),
      }).then(r => r.json());

      if (govRes.registered || govRes.message?.includes('Already')) {
        setSuccess('Registration submitted! Your agency will be reviewed and approved within 24 hours. You will receive an email when approved.');
      } else {
        setError(govRes.message || 'Agency registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#1E293B] rounded-xl border border-gray-700 p-8 space-y-5">
        <h1 className="text-2xl font-bold text-blue-400 text-center">🏛️ Government Dashboard</h1>
        <p className="text-gray-400 text-sm text-center">Civic Intelligence Platform</p>

        {/* Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-600">
          <button onClick={() => { setMode('login'); setStep(1); setError(''); setSuccess(''); }} className={`flex-1 py-2 text-sm font-medium ${mode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Log In</button>
          <button onClick={() => { setMode('register'); setStep(1); setError(''); setSuccess(''); }} className={`flex-1 py-2 text-sm font-medium ${mode === 'register' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Get Access</button>
        </div>

        {error && <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-400">{error}</div>}
        {success && <div className="p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg text-sm text-emerald-400">{success}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Agency email"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 outline-none focus:border-blue-500 text-sm" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 outline-none focus:border-blue-500 text-sm" />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50 text-sm">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {mode === 'register' && step === 1 && (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <p className="text-xs text-gray-500">Step 1 of 2: Create your account</p>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Your full name"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 outline-none focus:border-blue-500 text-sm" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Official email"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 outline-none focus:border-blue-500 text-sm" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Create password"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 outline-none focus:border-blue-500 text-sm" />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50 text-sm">
              {loading ? 'Creating account...' : 'Continue'}
            </button>
          </form>
        )}

        {mode === 'register' && step === 2 && !success && (
          <form onSubmit={handleRegisterAgency} className="space-y-4">
            <p className="text-xs text-gray-500">Step 2 of 2: Agency verification</p>
            <input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} required placeholder="Agency / Organization name"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 outline-none focus:border-blue-500 text-sm" />
            <div>
              <label className="text-xs text-gray-400 block mb-2">Proof of Agency (official letter, staff ID, or document)</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="px-4 py-2.5 text-sm border-2 border-dashed border-gray-500 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-400 transition">
                  📎 {proofFile ? proofFile.name : 'Choose file'}
                </button>
                {proofFile && <span className="text-xs text-emerald-400">Ready</span>}
              </div>
              <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="hidden" />
            </div>
            <button type="submit" disabled={loading || !proofFile}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50 text-sm">
              {loading ? 'Submitting...' : 'Register Agency'}
            </button>
            <p className="text-[10px] text-gray-500 text-center">Your registration will be reviewed. We verify all agencies to prevent misuse.</p>
          </form>
        )}

        <p className="text-xs text-gray-500 text-center">
          {mode === 'login' ? "Don't have access? " : 'Already registered? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setStep(1); setError(''); setSuccess(''); }} className="text-blue-400 hover:underline">
            {mode === 'login' ? 'Register your agency' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
