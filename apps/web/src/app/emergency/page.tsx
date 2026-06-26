'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const EMERGENCY_TYPES = [
  { key: 'fire', label: '🔥 Fire Outbreak', color: '#DC2626' },
  { key: 'violence', label: '⚔️ Violence/Attack', color: '#7C2D12' },
  { key: 'accident', label: '🚗 Accident', color: '#EA580C' },
  { key: 'flood', label: '🌊 Flooding', color: '#2563EB' },
  { key: 'security_threat', label: '🚨 Security Threat', color: '#991B1B' },
  { key: 'building_collapse', label: '🏚️ Building Collapse', color: '#78350F' },
  { key: 'medical', label: '🏥 Medical Emergency', color: '#059669' },
  { key: 'power_line', label: '⚡ Power Line/Electrocution', color: '#FBBF24' },
  { key: 'animal_attack', label: '🐍 Animal/Snake Attack', color: '#65A30D' },
  { key: 'gas_explosion', label: '💨 Gas Leak/Explosion', color: '#6B21A8' },
];

export default function EmergencyPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [broadcast, setBroadcast] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setError('Location access is required for SOS alerts')
    );
  }, [isAuthenticated, router]);

  const triggerSOS = async () => {
    if (!selectedType) { setError('Please select the emergency type'); return; }
    if (!location) { setError('Location is required for emergency alerts'); return; }
    if (!token) return;

    setSending(true);
    setError('');
    try {
      await fetch(`${API_URL}/emergency/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...location, type: selectedType, description, broadcast }),
      });
      setSent(true);
    } catch {
      setError('Failed to send SOS. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SOS Alert Sent</h1>
          <p className="text-gray-500 mb-6">Nearby users within 5km have been alerted. Stay safe.</p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
            <p className="text-sm font-bold text-red-800 mb-2">📞 Also call emergency services:</p>
            <div className="space-y-1 text-sm text-red-700">
              <p><strong>112</strong> — Police / General Emergency</p>
              <p><strong>767</strong> — Fire Service</p>
              <p><strong>112</strong> — Ambulance</p>
              <p><strong>0800-CALL-NEMA</strong> — Disaster Response</p>
            </div>
            <p className="text-xs text-red-500 mt-2">Numbers shown for Nigeria. Call your local emergency line if in another country.</p>
          </div>
          <button onClick={() => { setSent(false); setSelectedType(''); setDescription(''); }}
            className="px-6 py-3 bg-[#0F7B6C] text-white font-semibold rounded-lg hover:bg-[#0B6E4F]">
            Send Another Alert
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#D92D20]">🚨 Emergency SOS</h1>
        <p className="text-gray-500 mt-2">One tap to alert nearby users</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        {/* Emergency Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">What&apos;s happening?</label>
          <div className="grid grid-cols-2 gap-2">
            {EMERGENCY_TYPES.map((t) => (
              <button key={t.key} type="button" onClick={() => setSelectedType(t.key)}
                className={`px-3 py-3 text-sm font-medium rounded-lg border-2 transition ${selectedType === t.key ? 'text-white border-transparent' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                style={selectedType === t.key ? { backgroundColor: t.color } : {}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Details (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D92D20] outline-none resize-none"
            placeholder="Any additional details..." />
        </div>

        {/* Location */}
        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
          📍 {location ? `Location locked (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})` : 'Detecting location...'}
        </div>

        {/* Broadcast Toggle */}
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <input type="checkbox" checked={broadcast} onChange={(e) => setBroadcast(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#D92D20] focus:ring-[#D92D20]" />
          <div>
            <span className="text-sm font-medium text-gray-700">🔴 Auto-start emergency broadcast</span>
            <p className="text-xs text-gray-500">Starts a livestream so others can see what&apos;s happening</p>
          </div>
        </label>

        {/* SOS Button */}
        <button onClick={triggerSOS} disabled={sending}
          className="w-full py-4 bg-[#D92D20] text-white text-xl font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-50 shadow-lg">
          {sending ? 'SENDING...' : '🚨 SEND SOS ALERT'}
        </button>

        <p className="text-xs text-gray-400 text-center">This will share your location and alert all users within 5km radius</p>
      </div>
    </div>
  );
}
