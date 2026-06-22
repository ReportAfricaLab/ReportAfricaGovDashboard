'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/[.\\/]+$/, '');

const CATEGORIES = [
  { key: 'medical', label: '🏥 Medical Emergency' },
  { key: 'disaster', label: '🌊 Disaster Relief' },
  { key: 'abuse_survivor', label: '🛡️ Survivor Support' },
  { key: 'education', label: '📚 Education' },
  { key: 'legal_aid', label: '⚖️ Legal Aid' },
  { key: 'community', label: '🤝 Community Support' },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const { token, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({
    title: '', description: '', category: '', beneficiaryAmount: '', currency: 'NGN',
    isEmergency: false, beneficiaryName: '', beneficiaryBank: '', beneficiaryAccount: '',
    agreedToPlatformFee: false, reportId: '',
  });
  const [myReports, setMyReports] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    // Fetch user's reports to link campaign
    if (token) {
      fetch(`${API_URL}/reports/feed?country=${user?.country || 'NG'}&page=1`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(data => {
        const reports = data?.data || [];
        // Only show user's own reports with media
        const mine = reports.filter((r: any) => r.authorId === user?.id && r.media?.length > 0);
        setMyReports(mine);
      }).catch(() => {});
    }
  }, [isAuthenticated, token, router, user]);

  const beneficiaryAmount = Number(form.beneficiaryAmount) || 0;
  const reporterCommission = Math.round(beneficiaryAmount * 0.10);
  const platformFee = Math.round(beneficiaryAmount * 0.15);
  const campaignGoal = beneficiaryAmount + reporterCommission + platformFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { setError('Please select a category'); return; }
    if (!form.reportId) { setError('You must link this campaign to one of your reports'); return; }
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await api.donations.create(token, {
        ...form,
        targetAmount: campaignGoal,
        beneficiaryAmount,
      });
      router.push('/donations');
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Helping Hands Campaign</h1>
      <p className="text-gray-500 mb-6">Raise funds for someone in need through your verified report</p>

      {/* Requirements */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="text-sm font-bold text-blue-900 mb-2">📋 Requirements to create a campaign:</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>✅ Trust Score above 50</li>
          <li>✅ Completed Course 3: Investigative Journalism & Emergency Reporting (Academy)</li>
          <li>✅ Must link to your own report with evidence (photos/videos)</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        {/* Link to Report */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Link to Your Report *</label>
          {myReports.length > 0 ? (
            <select value={form.reportId} onChange={(e) => update('reportId', e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] outline-none">
              <option value="">Select a report...</option>
              {myReports.map((r: any) => (
                <option key={r.id} value={r.id}>{r.title} ({new Date(r.createdAt).toLocaleDateString()})</option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">No eligible reports found. You need a report with photos/videos to create a campaign.</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat.key} type="button" onClick={() => update('category', cat.key)}
                className={`px-3 py-2.5 text-xs font-medium rounded-lg border transition ${form.category === cat.key ? 'bg-[#F97316] text-white border-[#F97316]' : 'border-gray-200 text-gray-600 hover:border-[#F97316]'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
          <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} required maxLength={200}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
            placeholder="e.g. Help Amina get surgery for her child" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Story / Description</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} required rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none resize-none"
            placeholder="Tell the community what happened and why help is needed..." />
        </div>

        {/* Beneficiary Amount */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">How much does the beneficiary need?</label>
            <input type="number" value={form.beneficiaryAmount} onChange={(e) => update('beneficiaryAmount', e.target.value)} required min={1000}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
              placeholder="500000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select value={form.currency} onChange={(e) => update('currency', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] outline-none">
              <option value="NGN">NGN</option>
              <option value="GHS">GHS</option>
              <option value="KES">KES</option>
              <option value="ZAR">ZAR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Fee Breakdown (visible only to creator) */}
        {beneficiaryAmount > 0 && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <h4 className="text-sm font-bold text-gray-800 mb-2">Campaign Breakdown:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Beneficiary receives:</span><span className="font-semibold text-gray-900">{form.currency} {beneficiaryAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Your commission (10%):</span><span className="font-semibold text-green-700">{form.currency} {reporterCommission.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Platform fee (15%):</span><span className="text-gray-500">{form.currency} {platformFee.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2"><span className="font-bold text-gray-900">Campaign goal (donors see):</span><span className="font-bold text-[#F97316]">{form.currency} {campaignGoal.toLocaleString()}</span></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">💚 Donors only see the total goal. The beneficiary gets 100% of what they need.</p>
          </div>
        )}

        {/* Bank Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary Bank Name / Code</label>
          <input type="text" value={form.beneficiaryBank} onChange={(e) => update('beneficiaryBank', e.target.value)} required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
            placeholder="e.g. 058 (GTBank) or bank name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
          <input type="text" value={form.beneficiaryAccount} onChange={(e) => update('beneficiaryAccount', e.target.value.replace(/\D/g, ''))} required maxLength={10}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
            placeholder="0123456789" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary Name</label>
          <input type="text" value={form.beneficiaryName} onChange={(e) => update('beneficiaryName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
            placeholder="Who will receive the funds?" />
        </div>

        {/* Agreement */}
        <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-200">
          <input type="checkbox" checked={form.agreedToPlatformFee} onChange={(e) => update('agreedToPlatformFee', e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-[#F97316]" />
          <div>
            <span className="text-sm font-medium text-gray-700">I agree to the fee structure</span>
            <p className="text-xs text-gray-500">10% reporter commission + 15% platform fee are added on top of the beneficiary amount. The beneficiary receives 100% of their stated need.</p>
          </div>
        </label>

        {/* Emergency */}
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-red-50 rounded-lg border border-red-100">
          <input type="checkbox" checked={form.isEmergency} onChange={(e) => update('isEmergency', e.target.checked)}
            className="w-4 h-4 rounded text-[#D92D20]" />
          <div>
            <span className="text-sm font-medium text-gray-700">🚨 Mark as Emergency</span>
            <p className="text-xs text-gray-500">Emergency campaigns get priority visibility</p>
          </div>
        </label>

        <button type="submit" disabled={loading || !form.agreedToPlatformFee || !form.reportId}
          className="w-full py-3 bg-[#F97316] text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50">
          {loading ? 'Creating...' : 'Submit Campaign for Review'}
        </button>

        <p className="text-xs text-gray-400 text-center">Campaigns are reviewed by AI before going live.</p>
      </form>
    </div>
  );
}
