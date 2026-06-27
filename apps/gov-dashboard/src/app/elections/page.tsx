'use client';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.reportafrica.africa/api/v1';

export default function GovElectionsPage() {
  const [feed, setFeed] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [tab, setTab] = useState<'feed' | 'incidents' | 'results' | 'hotspots' | 'live'>('feed');
  const [country, setCountry] = useState('NG');

  useEffect(() => {
    fetch(`${API_URL}/elections/feed?country=${country}`).then(r => r.json()).then(d => setFeed(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API_URL}/elections/incidents?country=${country}`).then(r => r.json()).then(d => setIncidents(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API_URL}/elections/hotspots?country=${country}&election=2027+General+Election`).then(r => r.json()).then(d => setHotspots(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API_URL}/elections/results?country=${country}&election=2027+General+Election`).then(r => r.json()).then(d => setResults(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API_URL}/elections/live?country=${country}`).then(r => r.json()).then(d => setLiveStreams(Array.isArray(d) ? d : [])).catch(() => {});
  }, [country]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🗳️ Election Monitor</h1>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none">
          <option value="NG">Nigeria</option><option value="GH">Ghana</option><option value="KE">Kenya</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1E293B] rounded-xl p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-blue-400">{feed.length}</p>
          <p className="text-xs text-gray-400">Total Reports</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-red-400">{incidents.length}</p>
          <p className="text-xs text-gray-400">Incidents</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-orange-400">{hotspots.length}</p>
          <p className="text-xs text-gray-400">Hotspot Areas</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['feed', 'incidents', 'results', 'hotspots', 'live'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-medium rounded-lg ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            {t === 'feed' ? '📰 All' : t === 'incidents' ? '⚠️ Incidents' : t === 'results' ? '📊 Results' : t === 'hotspots' ? '🔥 Hotspots' : '🔴 Live'}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <div className="space-y-2">
          {feed.map((r: any) => (
            <div key={r.id} className="bg-[#1E293B] rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${r.type === 'violence' ? 'bg-red-600' : r.type === 'result_upload' ? 'bg-green-600' : 'bg-orange-600'}`}>{r.type?.replace('_', ' ')}</span>
                {r.state && <span className="text-xs text-gray-400">{r.state}</span>}
              </div>
              <p className="text-sm text-gray-200">{r.description || r.electionName}</p>
              <p className="text-xs text-gray-500 mt-1">{r.user?.displayName || 'Anonymous'} · {new Date(r.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {feed.length === 0 && <p className="text-gray-500 text-center py-8">No election reports</p>}
        </div>
      )}

      {tab === 'incidents' && (
        <div className="space-y-2">
          {incidents.map((r: any) => (
            <div key={r.id} className="bg-red-950/20 rounded-lg p-4 border border-red-800/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-red-600 text-white">{r.type?.replace('_', ' ')}</span>
                {r.state && <span className="text-xs text-gray-400">{r.state}</span>}
                {r.lga && <span className="text-xs text-gray-500">· {r.lga}</span>}
              </div>
              <p className="text-sm text-gray-200">{r.description}</p>
            </div>
          ))}
          {incidents.length === 0 && <p className="text-gray-500 text-center py-8">No election incidents</p>}
        </div>
      )}

      {tab === 'hotspots' && (
        <div className="grid grid-cols-2 gap-3">
          {hotspots.map((h: any, i: number) => (
            <div key={i} className="bg-[#1E293B] rounded-lg p-4 border border-gray-700">
              <p className="font-semibold text-gray-100">{h.state || 'Unknown'}</p>
              <p className="text-xs text-gray-400 capitalize">{h.type?.replace('_', ' ')}</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">{h.count}</p>
            </div>
          ))}
          {hotspots.length === 0 && <p className="text-gray-500 text-center py-8 col-span-2">No hotspots</p>}
        </div>
      )}

      {tab === 'results' && (
        <div className="space-y-2">
          {results.map((r: any) => (
            <div key={r.id} className="bg-[#1E293B] rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-green-600 text-white">RESULT</span>
                {r.state && <span className="text-xs text-gray-400">{r.state}</span>}
                {r.pollingUnit && <span className="text-xs text-gray-500">· PU: {r.pollingUnit}</span>}
              </div>
              {r.results && Object.keys(r.results).length > 0 && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-gray-800 rounded mt-2">
                  {Object.entries(r.results).map(([party, votes]) => (
                    <div key={party} className="flex justify-between text-xs">
                      <span className="text-gray-300">{party}</span>
                      <span className="text-white font-bold">{String(votes)}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">{r.user?.displayName || 'Anonymous'} · {new Date(r.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {results.length === 0 && <p className="text-gray-500 text-center py-8">No results uploaded</p>}
        </div>
      )}

      {tab === 'live' && (
        <div className="space-y-2">
          {liveStreams.map((s: any) => (
            <div key={s.id} className="bg-[#1E293B] rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-400">LIVE</span>
                {s.electionState && <span className="text-xs text-gray-400">{s.electionState}</span>}
                <span className="text-xs text-gray-500 ml-auto">👁 {s.viewerCount || 0}</span>
              </div>
              <p className="text-sm text-gray-200">{s.title}</p>
              <p className="text-xs text-gray-500 mt-1">{s.user?.displayName || 'Anonymous'} · Started {new Date(s.startedAt).toLocaleTimeString()}</p>
            </div>
          ))}
          {liveStreams.length === 0 && <p className="text-gray-500 text-center py-8">No election livestreams</p>}
        </div>
      )}
    </div>
  );
}
