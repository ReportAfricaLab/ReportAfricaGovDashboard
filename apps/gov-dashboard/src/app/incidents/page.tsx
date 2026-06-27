'use client';
import { useState, useEffect } from 'react';
import { govAPI } from '@/lib/api';
import { useJurisdiction } from '@/lib/useJurisdiction';

export default function IncidentsPage() {
  const { country, state } = useJurisdiction();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => { govAPI.mapData(country, state || undefined).then((d: any) => setData(d.data || [])).catch(() => {}); }, [country, state]);

  const incidents = data.filter((r: any) => ['critical', 'high'].includes(r.severity));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">⚠️ Active Incidents</h1>
      <p className="text-gray-400 text-sm mb-6">Critical and high severity reports — {state || country}</p>
      <div className="space-y-3">
        {incidents.map((r: any) => (
          <a key={r.id} href={`/report/${r.id}`} className="block bg-[#1E293B] rounded-xl p-5 border border-gray-700 hover:border-blue-500 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded text-white ${r.severity === 'critical' ? 'bg-red-600' : 'bg-orange-600'}`}>{r.severity?.toUpperCase()}</span>
              <span className="text-xs text-gray-400 capitalize">{r.category?.replace('_', ' ')}</span>
              <span className="text-xs text-gray-500 ml-auto">{new Date(r.createdAt).toLocaleString()}</span>
            </div>
            <h3 className="font-medium text-gray-100">{r.title}</h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{r.description}</p>
            <p className="text-xs text-gray-500 mt-2">{r.state || r.city || ''}</p>
          </a>
        ))}
        {incidents.length === 0 && <p className="text-gray-500 text-center py-12">No active critical/high incidents</p>}
      </div>
    </div>
  );
}
