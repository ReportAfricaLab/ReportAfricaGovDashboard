'use client';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type Tab = 'feed' | 'incidents' | 'results' | 'hotspots';

const INCIDENT_COLORS: Record<string, string> = {
  violence: '#DC2626',
  vote_buying: '#F97316',
  intimidation: '#7C2D12',
  ballot_snatching: '#991B1B',
  result_upload: '#059669',
  observer_report: '#2563EB',
};

export default function ElectionsPage() {
  const [tab, setTab] = useState<Tab>('feed');
  const [feed, setFeed] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [election, setElection] = useState('2027 General Election');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'feed') {
        const res = await fetch(`${API_URL}/elections/feed?country=NG&election=${encodeURIComponent(election)}`);
        setFeed(await res.json());
      } else if (tab === 'incidents') {
        const res = await fetch(`${API_URL}/elections/incidents?country=NG`);
        setIncidents(await res.json());
      } else if (tab === 'hotspots') {
        const res = await fetch(`${API_URL}/elections/hotspots?country=NG&election=${encodeURIComponent(election)}`);
        setHotspots(await res.json());
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🗳️ Election Monitor</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time citizen election reporting</p>
        </div>
        <select value={election} onChange={(e) => setElection(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none">
          <option>2027 General Election</option>
          <option>2025 Off-Cycle Governorship</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {([['feed', '📰 Feed'], ['incidents', '⚠️ Incidents'], ['results', '📊 Results'], ['hotspots', '🔥 Hotspots']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${tab === key ? 'bg-[#0F7B6C] text-white' : 'bg-gray-100 text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading...</div>}

      {/* Feed Tab */}
      {!loading && tab === 'feed' && (
        <div className="space-y-4">
          {feed.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-4xl mb-3">🗳️</p>
              <p className="text-gray-700 font-medium">No election reports yet</p>
              <p className="text-gray-500 text-sm mt-1">Reports will appear here during elections</p>
            </div>
          ) : (
            feed.map((r: any) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-bold rounded text-white" style={{ backgroundColor: INCIDENT_COLORS[r.type] || '#6B7280' }}>
                    {r.type.replace('_', ' ').toUpperCase()}
                  </span>
                  {r.state && <span className="text-xs text-gray-500">{r.state}</span>}
                  {r.pollingUnit && <span className="text-xs text-gray-400">· PU: {r.pollingUnit}</span>}
                </div>
                <p className="text-sm text-gray-800">{r.description || r.electionName}</p>
                {r.results && Object.keys(r.results).length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Results:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(r.results).map(([party, votes]) => (
                        <div key={party} className="flex justify-between text-xs">
                          <span className="text-gray-700 font-medium">{party}</span>
                          <span className="text-gray-900 font-bold">{String(votes)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {r.user?.displayName || 'Anonymous'} · {new Date(r.createdAt).toLocaleString()}
                  {r.isVerifiedObserver && <span className="ml-2 text-green-600 font-semibold">✓ Verified Observer</span>}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Incidents Tab */}
      {!loading && tab === 'incidents' && (
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-gray-700 font-medium">No incidents reported</p>
            </div>
          ) : (
            incidents.map((r: any) => (
              <div key={r.id} className="bg-white rounded-xl border border-red-100 p-4 flex items-start gap-3">
                <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: INCIDENT_COLORS[r.type] || '#DC2626' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{r.type.replace('_', ' ')} — {r.state || 'Unknown'}</p>
                  <p className="text-xs text-gray-600 mt-1">{r.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{r.lga && `${r.lga}, `}{r.ward && `${r.ward} · `}{new Date(r.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Results Tab */}
      {!loading && tab === 'results' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-700 font-medium">Results Collation</p>
          <p className="text-gray-500 text-sm mt-1">Citizen-reported results from polling units will be aggregated here during elections</p>
        </div>
      )}

      {/* Hotspots Tab */}
      {!loading && tab === 'hotspots' && (
        <div>
          {hotspots.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-4xl mb-3">🗺️</p>
              <p className="text-gray-700 font-medium">No hotspots detected</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {hotspots.map((h: any, i: number) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{h.state || 'Unknown'}</h3>
                    <span className="px-2 py-0.5 text-xs font-bold rounded text-white" style={{ backgroundColor: INCIDENT_COLORS[h.type] || '#6B7280' }}>
                      {h.type?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{h.count}</p>
                  <p className="text-xs text-gray-500">reports</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
