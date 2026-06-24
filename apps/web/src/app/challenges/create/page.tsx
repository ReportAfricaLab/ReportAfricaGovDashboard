'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function CreateChallengePage() {
  const { token, user } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [form, setForm] = useState({ businessId: '', title: '', description: '', productName: '', productImageUrl: '', potAmount: '', deadline: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/businesses/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setBusinesses(Array.isArray(d) ? d : [])).catch(() => {});
  }, [token]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    try {
      const data = await api.upload.getPresignedUrl(token, 'image', file.type);
      await fetch(data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setForm({ ...form, productImageUrl: data.fileUrl });
    } catch { }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.businessId || !form.title || !form.productName || !form.potAmount || !form.deadline) {
      setMessage('Fill all required fields'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/challenges`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          potAmount: Number(form.potAmount),
          email: user?.email || '',
        }),
      });
      const data = await res.json();
      if (data.paymentUrl) window.location.href = data.paymentUrl;
      else if (res.ok) setMessage('Challenge created! Awaiting payment.');
      else setMessage(data.message || 'Failed to create challenge');
    } catch { setMessage('Failed'); }
    setLoading(false);
  };

  if (!token) return <div className="max-w-md mx-auto px-4 py-20 text-center text-gray-400">Please log in</div>;

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 14);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <a href="/challenges" className="text-sm text-[#0F7B6C] hover:underline mb-4 block">← All Challenges</a>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🎯 Create Promo Challenge</h1>
      <p className="text-gray-500 text-sm mb-6">Post a challenge for reporters to promote your product. Top 5 by views win from your pot.</p>

      {businesses.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">⚠️ You need to <a href="/business" className="underline font-medium">register a business</a> first.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Business *</label>
          <select value={form.businessId} onChange={e => setForm({ ...form, businessId: e.target.value })} required
            className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-lg text-sm">
            <option value="">Select business</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Challenge Title *</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
            placeholder="e.g. Show us how you use our product!" className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-lg text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="What should reporters show in their video?" rows={3} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-lg text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Product Name *</label>
          <input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} required
            placeholder="e.g. SuperClean Detergent" className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-lg text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Product Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full mt-1 text-sm" />
          {form.productImageUrl && <img src={form.productImageUrl} alt="" className="w-20 h-20 rounded mt-2 object-cover" />}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Prize Pot Amount * <span className="text-xs text-gray-400">(min ≈$200 in your currency)</span></label>
          <input value={form.potAmount} onChange={e => setForm({ ...form, potAmount: e.target.value })} type="number" required
            placeholder="e.g. 300000" className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-lg text-sm" />
          <p className="text-[10px] text-gray-400 mt-1">Platform takes 30%. Remaining 70% split among top 5 reporters by views.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Deadline * <span className="text-xs text-gray-400">(min 14 days)</span></label>
          <input value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} type="date" required
            min={minDate.toISOString().split('T')[0]} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-lg text-sm" />
        </div>

        {message && <p className="text-sm text-red-600">{message}</p>}

        <button type="submit" disabled={loading || businesses.length === 0}
          className="w-full py-3 bg-[#0F7B6C] text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-[#0B6E4F]">
          {loading ? 'Creating...' : 'Create & Pay Pot'}
        </button>
      </form>
    </div>
  );
}
