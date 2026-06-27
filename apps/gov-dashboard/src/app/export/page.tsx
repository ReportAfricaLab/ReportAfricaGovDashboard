'use client';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.reportafrica.africa/api/v1';

export default function ExportPage() {
  const [country, setCountry] = useState('NG');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [state, setState] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setMessage('');
    try {
      const token = localStorage.getItem('gov_token');
      const params = new URLSearchParams({ country, page: '1' });
      if (category) params.set('category', category);
      if (severity) params.set('severity', severity);
      if (state) params.set('state', state);
      if (dateFrom) params.set('dateFrom', dateFrom);

      const res = await fetch(`${API_URL}/reports/feed?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      const reports = data.data || data || [];

      if (reports.length === 0) { setMessage('No data to export'); setExporting(false); return; }

      // Generate CSV
      const headers = ['ID', 'Title', 'Category', 'Severity', 'State', 'City', 'Latitude', 'Longitude', 'Verification', 'Upvotes', 'Downvotes', 'Views', 'Date'];
      const rows = reports.map((r: any) => [
        r.id, `"${(r.title || '').replace(/"/g, '""')}"`, r.category, r.severity,
        r.state || '', r.city || '', r.latitude || '', r.longitude || '',
        r.verificationLevel, r.upvotes, r.downvotes, r.viewCount,
        new Date(r.createdAt).toISOString(),
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reportafrica_export_${country}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`✅ Exported ${reports.length} reports`);
    } catch { setMessage('❌ Export failed'); }
    setExporting(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">📥 Export Data</h1>
      <p className="text-gray-400 text-sm mb-6">Download incident data as CSV for official reporting</p>

      <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700 max-w-lg space-y-4">
        <div>
          <label className="text-sm text-gray-400">Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="NG">Nigeria</option><option value="GH">Ghana</option><option value="KE">Kenya</option><option value="ZA">South Africa</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-400">Category (optional)</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="">All Categories</option>
            <option value="emergency">Emergency</option><option value="traffic">Traffic</option><option value="police_security">Security</option>
            <option value="government">Government</option><option value="election">Election</option><option value="health">Health</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-400">Severity (optional)</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="">All</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-400">State/Region (optional)</label>
          <input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Lagos"
            className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" />
        </div>
        <div>
          <label className="text-sm text-gray-400">From Date (optional)</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" />
        </div>

        {message && <p className="text-sm">{message}</p>}

        <button onClick={handleExport} disabled={exporting}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50">
          {exporting ? 'Exporting...' : '📥 Export CSV'}
        </button>
      </div>
    </div>
  );
}
