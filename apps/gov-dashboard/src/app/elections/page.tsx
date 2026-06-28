'use client';
import { useState, useEffect } from 'react';
import { govAPI } from '@/lib/api';
import { useJurisdiction } from '@/lib/useJurisdiction';

export default function GovElectionsPage() {
  const { country, dateFrom } = useJurisdiction();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'feed' | 'incidents' | 'results' | 'parallel'>('feed');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { govAPI.elections(country).then(setData).catch(() => {}); }, [country, dateFrom]);

  const [parallelData, setParallelData] = useState<any>(null);
  useEffect(() => {
    if (tab === 'parallel') {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.reportafrica.africa/api/v1';
      fetch(`${API_URL}/elections/parallel-count?country=${country}&election=2027+General+Election`).then(r => r.json()).then(setParallelData).catch(() => {});
    }
  }, [tab, country]);

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
        {(['feed', 'incidents', 'results', 'parallel'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-medium rounded-lg ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            {t === 'feed' ? '📰 All' : t === 'incidents' ? '⚠️ Incidents' : t === 'results' ? '📊 Results' : '🗳️ Parallel Count'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {(tab === 'feed' ? feed : tab === 'incidents' ? incidents : results).map((r: any) => (
          <div key={r.id} onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="bg-[#1E293B] rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-blue-500 transition">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${r.type === 'violence' ? 'bg-red-600' : r.type === 'result_upload' ? 'bg-green-600' : 'bg-orange-600'}`}>{r.type?.replace('_', ' ')}</span>
              {r.state && <span className="text-xs text-gray-400">{r.state}</span>}
              {r.pollingUnit && <span className="text-xs text-gray-500">· PU: {r.pollingUnit}</span>}
              {r.isVerifiedObserver && <span className="text-[10px] text-emerald-400 font-bold ml-auto">✓ Observer</span>}
            </div>
            <p className={`text-sm text-gray-200 ${expanded === r.id ? '' : 'line-clamp-2'}`}>{r.description || r.electionName}</p>

            {expanded === r.id && (
              <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                {r.lga && <p className="text-xs text-gray-400">📍 LGA: {r.lga}{r.ward ? ` · Ward: ${r.ward}` : ''}</p>}
                {r.latitude && <p className="text-xs text-gray-500">Coords: {Number(r.latitude).toFixed(4)}, {Number(r.longitude).toFixed(4)} · <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" className="text-blue-400 hover:underline">Map →</a></p>}
                {r.results && Object.keys(r.results).length > 0 && (
                  <div className="grid grid-cols-2 gap-2 p-2 bg-gray-800 rounded">
                    {Object.entries(r.results).map(([party, votes]) => (
                      <div key={party} className="flex justify-between text-xs">
                        <span className="text-gray-300">{party}</span>
                        <span className="text-white font-bold">{String(votes)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {r.media?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {r.media.map((m: any, i: number) => (
                      <div key={i} className="w-20 h-20 rounded overflow-hidden bg-gray-800">
                        {m.type?.startsWith('video') ? (
                          <video src={m.url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={m.url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">Election: {r.electionName}</p>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">{r.user?.displayName || 'Anonymous'} · {new Date(r.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {(tab === 'feed' ? feed : tab === 'incidents' ? incidents : results).length === 0 && <p className="text-gray-500 text-center py-8">No data</p>}
      </div>

      {tab === 'parallel' && (
        <div>
          {!parallelData?.stateResults || Object.keys(parallelData.stateResults || {}).length === 0 ? (
            <p className="text-gray-500 text-center py-12">No parallel count data yet. Citizens need to upload PU results.</p>
          ) : (
            <>
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-300">Citizen Parallel Vote Tabulation · {parallelData.totalPUs} PUs reported</p>
              </div>
              <div className="bg-[#1E293B] rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-400">State</th>
                      {Object.keys((Object.values(parallelData.stateResults)[0] as any)?.parties || {}).map((p: string) => <th key={p} className="px-3 py-2 text-right text-gray-400">{p}</th>)}
                      <th className="px-3 py-2 text-right text-gray-400">PUs</th>
                      <th className="px-3 py-2 text-right text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {Object.entries(parallelData.stateResults).map(([st, info]: [string, any]) => (
                      <tr key={st}>
                        <td className="px-3 py-2 text-gray-200 font-medium">{st}</td>
                        {Object.values(info.parties).map((v: any, i: number) => <td key={i} className="px-3 py-2 text-right text-white font-bold">{Number(v).toLocaleString()}</td>)}
                        <td className="px-3 py-2 text-right text-gray-400">{info.puCount}</td>
                        <td className="px-3 py-2 text-right">
                          {info.verified > 0 && <span className="text-emerald-400">✓{info.verified}</span>}
                          {info.disputed > 0 && <span className="text-red-400 ml-1">⚠️{info.disputed}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
