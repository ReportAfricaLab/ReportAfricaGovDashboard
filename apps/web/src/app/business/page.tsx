'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const CATEGORIES = ['restaurant', 'clinic', 'shop', 'bank', 'fuel_station', 'hotel', 'pharmacy', 'school', 'salon', 'logistics', 'other'];

export default function BusinessPage() {
  const { token, user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<'plans' | 'register' | 'my' | 'analytics'>('plans');
  const [plans, setPlans] = useState<any[]>([]);
  const [myBusinesses, setMyBusinesses] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', category: '', phone: '', email: '', address: '', city: '', state: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/businesses/plans?country=${user?.country || 'NG'}`).then(r => r.json()).then(setPlans).catch(() => {});
    if (token) fetch(`${API_URL}/businesses/my`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setMyBusinesses).catch(() => {});
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.name || !form.category) { setMessage('Name and category required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/businesses/register`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setMessage('Business registered! Now subscribe for verification.'); setTab('my'); const data = await res.json(); setMyBusinesses(prev => [data, ...prev]); }
      else { const d = await res.json(); setMessage(d.message || 'Registration failed'); }
    } catch { setMessage('Failed'); }
    setLoading(false);
  };

  const handleSubscribe = async (businessId: string, tier: string) => {
    if (!token || !user?.email) return;
    try {
      const res = await fetch(`${API_URL}/businesses/subscribe`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId, tier, email: user.email }) });
      const data = await res.json();
      if (data.paymentUrl) window.location.href = data.paymentUrl;
      else setMessage(data.message || 'Failed to start subscription');
    } catch { setMessage('Failed'); }
  };

  const loadAnalytics = async (businessId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/businesses/${businessId}/analytics`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setAnalytics(data);
      else setAnalytics({ error: data.message || 'Failed to load analytics' });
    } catch { setAnalytics({ error: 'Failed to load' }); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🏪 Business Trust Badges</h1>
      <p className="text-gray-500 text-sm mb-6">Get verified, respond to reports, and build customer trust.</p>

      <div className="flex gap-2 mb-6">
        {(['plans', 'register', 'my', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === t ? 'bg-[#0F7B6C] text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t === 'plans' ? '💎 Plans' : t === 'register' ? '📝 Register' : t === 'my' ? '🏢 My Businesses' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-green-600 mb-4">{message}</p>}

      {tab === 'plans' && (
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((p: any) => (
            <div key={p.tier} className={`bg-white border rounded-xl p-6 text-center ${p.tier === 'pro' ? 'border-[#0F7B6C] ring-2 ring-[#0F7B6C]/20' : 'border-gray-200'}`}>
              {p.tier === 'pro' && <p className="text-[10px] font-bold text-[#0F7B6C] mb-2">MOST POPULAR</p>}
              <h3 className="text-lg font-bold text-gray-900 capitalize">{p.label}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{p.currency} {p.price.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <ul className="text-xs text-gray-600 mt-4 space-y-1.5 text-left">
                <li>✓ Verified badge</li>
                <li>✓ Respond to reports</li>
                {(p.tier === 'pro' || p.tier === 'enterprise') && <li>✓ Promoted in nearby feed</li>}
                {(p.tier === 'pro' || p.tier === 'enterprise') && <li>✓ Analytics dashboard</li>}
                {p.tier === 'enterprise' && <li>✓ Priority alert sponsoring</li>}
                {p.tier === 'enterprise' && <li>✓ Dedicated support</li>}
              </ul>
              {isAuthenticated && <button onClick={() => setTab('register')} className="mt-4 w-full py-2 bg-[#0F7B6C] text-white text-sm font-medium rounded-lg hover:bg-[#0B6E4F]">Get Started</button>}
            </div>
          ))}
        </div>
      )}

      {tab === 'register' && (
        <form onSubmit={handleRegister} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Business Name" required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm">
            <option value="">Select Category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="px-4 py-3 border border-gray-200 rounded-lg text-sm" />
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Business Email" className="px-4 py-3 border border-gray-200 rounded-lg text-sm" />
          </div>
          <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" className="px-4 py-3 border border-gray-200 rounded-lg text-sm" />
            <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="State" className="px-4 py-3 border border-gray-200 rounded-lg text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#0F7B6C] text-white font-semibold rounded-lg disabled:opacity-50">{loading ? 'Registering...' : 'Register Business'}</button>
        </form>
      )}

      {tab === 'my' && (
        <div className="space-y-4">
          {myBusinesses.length === 0 && <p className="text-center text-gray-400 py-8">No businesses registered yet</p>}
          {myBusinesses.map((b: any) => (
            <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-gray-900">{b.name}</h3>
                {b.isVerified && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">✓ Verified</span>}
                {b.subscriptionTier !== 'none' && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-medium capitalize">{b.subscriptionTier}</span>}
              </div>
              <p className="text-sm text-gray-500 capitalize">{b.category.replace('_', ' ')} · {b.city || b.state || b.country}</p>
              {b.subscriptionTier === 'none' && (
                <div className="flex gap-2 mt-3">
                  {plans.map((p: any) => (
                    <button key={p.tier} onClick={() => handleSubscribe(b.id, p.tier)} className="flex-1 py-2 bg-[#0F7B6C] text-white text-xs font-medium rounded-lg hover:bg-[#0B6E4F]">
                      {p.label} — {p.currency} {p.price.toLocaleString()}/mo
                    </button>
                  ))}
                </div>
              )}
              {b.isVerified && (
                <button onClick={() => { setTab('analytics'); loadAnalytics(b.id); }} className="mt-3 text-xs text-[#0F7B6C] font-medium hover:underline">View Analytics →</button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-4">
          {!analytics ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Select a business from "My Businesses" to view analytics</p>
              <button onClick={() => setTab('my')} className="mt-3 text-sm text-[#0F7B6C] font-medium">Go to My Businesses</button>
            </div>
          ) : analytics.error ? (
            <div className="bg-amber-50 rounded-xl p-6 text-center">
              <p className="text-amber-800 font-medium">{analytics.error}</p>
              <p className="text-xs text-amber-600 mt-2">Upgrade to Pro or Enterprise to access analytics.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                  <p className="text-2xl font-bold text-gray-900">{analytics.nearbyReports}</p>
                  <p className="text-xs text-gray-500">Reports Nearby</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalViews?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Views on Nearby</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                  <p className="text-2xl font-bold text-gray-900">{analytics.responsesPosted}</p>
                  <p className="text-xs text-gray-500">Responses Posted</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Analytics updates in real-time. Tier: {analytics.tier}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
