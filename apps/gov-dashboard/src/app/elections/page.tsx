'use client';
import { useState, useEffect } from 'react';
import { govAPI } from '@/lib/api';
import { useJurisdiction } from '@/lib/useJurisdiction';

export default function GovElectionsPage() {
  const { country } = useJurisdiction();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'feed' | 'incidents' | 'results'>('feed');

  useEffect(() => { govAPI.elections(country).then(setData).catch(() => {}); }, [country]);

  const feed = data?.feed || [];
  const incidents = data?.incidents || [];
  const results = data?.results || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">🗳️ Election Monitor</h1>
      <p className="text-gray-400 text-sm mb-6">Election intelligence — {country}</p>

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
          <p className="text-2xl font-bold text-green-400">{results.length}</p>
          <p className="text-xs text-gray-400">Results Uploaded</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['feed', 'incidents', 'results'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-medium rounded-lg ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            {t === 'feed' ? '📰 All' : t === 'incidents' ? '⚠️ Incidents' : '📊 Results'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {(tab === 'feed' ? feed : tab === 'incidents' ? incidents : results).map((r: any) => (
          <div key={r.id} className="bg-[#1E293B] rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${r.type === 'violence' ? 'bg-red-600' : r.type === 'result_upload' ? 'bg-green-600' : 'bg-orange-600'}`}>{r.type?.replace('_', ' ')}</span>
              {r.state && <span className="text-xs text-gray-400">{r.state}</span>}
            </div>
            <p className="text-sm text-gray-200">{r.description || r.electionName}</p>
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
        {(tab === 'feed' ? feed : tab === 'incidents' ? incidents : results).length === 0 && <p className="text-gray-500 text-center py-8">No data</p>}
      </div>
    </div>
  );
}
