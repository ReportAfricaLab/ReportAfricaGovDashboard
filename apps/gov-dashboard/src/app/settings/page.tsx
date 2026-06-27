'use client';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.reportafrica.africa/api/v1';
const CATEGORIES = ['emergency', 'traffic', 'police_security', 'government', 'election', 'health', 'corruption', 'environmental', 'gender_violence', 'utilities', 'missing_persons'];

export default function SettingsPage() {
  const [jurisdiction, setJurisdiction] = useState({ country: 'NG', state: '', lga: '' });
  const [alerts, setAlerts] = useState({ enabled: true, minSeverity: 'high', threshold: 5 });
  const [categories, setCategories] = useState<string[]>(['emergency', 'police_security']);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gov_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.jurisdiction) setJurisdiction(parsed.jurisdiction);
      if (parsed.alerts) setAlerts(parsed.alerts);
      if (parsed.categories) setCategories(parsed.categories);
    }
  }, []);

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleSave = async () => {
    const settings = { jurisdiction, alerts, categories };
    localStorage.setItem('gov_settings', JSON.stringify(settings));

    // Save to backend
    const token = localStorage.getItem('gov_token');
    if (token) {
      try {
        await fetch(`${API_URL}/gov/settings`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
      } catch {}
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">⚙️ Settings</h1>
      <p className="text-gray-400 text-sm mb-6">Configure your jurisdiction and alert preferences</p>

      <div className="max-w-lg space-y-6">
        {/* Jurisdiction */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
          <h2 className="font-semibold mb-4">📍 Jurisdiction</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">Country</label>
              <select value={jurisdiction.country} onChange={(e) => setJurisdiction({ ...jurisdiction, country: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none">
                <option value="NG">Nigeria</option><option value="GH">Ghana</option><option value="KE">Kenya</option><option value="ZA">South Africa</option><option value="UG">Uganda</option><option value="TZ">Tanzania</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">State/Region</label>
              <input value={jurisdiction.state} onChange={(e) => setJurisdiction({ ...jurisdiction, state: e.target.value })}
                placeholder="e.g. Lagos" className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400">LGA/District</label>
              <input value={jurisdiction.lga} onChange={(e) => setJurisdiction({ ...jurisdiction, lga: e.target.value })}
                placeholder="e.g. Ikeja" className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
          </div>
        </div>

        {/* Alert Preferences */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
          <h2 className="font-semibold mb-4">🔔 Alert Preferences</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={alerts.enabled} onChange={(e) => setAlerts({ ...alerts, enabled: e.target.checked })}
                className="rounded border-gray-600 bg-gray-700 text-blue-500" />
              <span className="text-sm text-gray-300">Enable email alerts</span>
            </label>
            <div>
              <label className="text-xs text-gray-400">Minimum Severity</label>
              <select value={alerts.minSeverity} onChange={(e) => setAlerts({ ...alerts, minSeverity: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none">
                <option value="low">All (Low+)</option><option value="medium">Medium+</option><option value="high">High+</option><option value="critical">Critical only</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Alert Threshold (reports per hour to trigger)</label>
              <input type="number" value={alerts.threshold} onChange={(e) => setAlerts({ ...alerts, threshold: Number(e.target.value) })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" min={1} max={50} />
            </div>
          </div>
        </div>

        {/* Preferred Categories */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
          <h2 className="font-semibold mb-4">📋 Preferred Categories</h2>
          <p className="text-xs text-gray-400 mb-3">Select categories you want to monitor. You'll only be alerted for these.</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition capitalize ${categories.includes(cat) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-700 text-gray-400 hover:border-blue-500'}`}>
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {saved && <p className="text-sm text-emerald-400">✅ Settings saved</p>}
        <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500">
          Save Settings
        </button>
      </div>
    </div>
  );
}
