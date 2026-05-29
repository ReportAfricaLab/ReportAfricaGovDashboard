'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const CATEGORIES = [
  { key: 'traffic', label: 'Traffic' },
  { key: 'police_security', label: 'Police & Security' },
  { key: 'government', label: 'Government' },
  { key: 'construction', label: 'Construction' },
  { key: 'emergency', label: 'Emergency' },
  { key: 'environmental', label: 'Environmental' },
  { key: 'market_consumer', label: 'Market & Consumer' },
];

export default function WatchlistPage() {
  const { token } = useAuth();
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [radius, setRadius] = useState('5');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  useEffect(() => {
    if (token) loadWatchlists();
  }, [token]);

  const loadWatchlists = () => {
    if (!token) return;
    setLoading(true);
    api.watchlist.getAll(token).then(setWatchlists).finally(() => setLoading(false));
  };

  const handleCreate = async () => {
    if (!token || !name.trim()) return;
    // Use browser geolocation
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await api.watchlist.create(token, {
        name: name.trim(),
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        radiusKm: Number(radius) || 5,
        categories: selectedCats,
      });
      setName(''); setRadius('5'); setSelectedCats([]); setShowForm(false);
      loadWatchlists();
    }, () => alert('Location access required'));
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Delete this watchlist?')) return;
    await api.watchlist.delete(token, id);
    loadWatchlists();
  };

  const toggleCat = (cat: string) => {
    setSelectedCats((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  if (!token) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">Please log in to manage watchlists</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">📍 Watchlists</h1>
      <p className="text-gray-500 text-sm mb-6">Get push alerts when reports happen near your zones</p>

      <button onClick={() => setShowForm(!showForm)}
        className="w-full py-3 bg-[#0F7B6C] text-white rounded-lg font-medium mb-6 hover:bg-[#0B6E4F] transition">
        {showForm ? 'Cancel' : '+ New Watchlist'}
      </button>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Zone name (e.g. My Home)"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm" />
          <input value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="Radius in km" type="number"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm" />
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Alert categories (leave empty for all):</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat.key} onClick={() => toggleCat(cat.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedCats.includes(cat.key) ? 'bg-[#0F7B6C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleCreate} className="w-full py-3 bg-[#0F7B6C] text-white rounded-lg font-medium hover:bg-[#0B6E4F] transition">
            Create (uses current location)
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-12">Loading...</p>
      ) : watchlists.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No watchlists yet. Create one to get alerts!</p>
      ) : (
        <div className="space-y-3">
          {watchlists.map((wl: any) => (
            <div key={wl.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">📍 {wl.name}</h3>
                <button onClick={() => handleDelete(wl.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
              </div>
              <p className="text-xs text-gray-500">Radius: {wl.radiusKm}km</p>
              <p className="text-xs text-gray-500">Categories: {wl.categories?.length > 0 ? wl.categories.join(', ') : 'All'}</p>
              <span className={`text-xs font-medium ${wl.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                {wl.isActive ? '● Active' : '○ Paused'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
