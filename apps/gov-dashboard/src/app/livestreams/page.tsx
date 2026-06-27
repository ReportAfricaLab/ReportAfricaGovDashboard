'use client';
import { useState, useEffect } from 'react';
import { useJurisdiction } from '@/lib/useJurisdiction';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.reportafrica.africa/api/v1';

export default function LivestreamsPage() {
  const { country } = useJurisdiction();
  const [streams, setStreams] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/livestream/live?country=${country}`).then(r => r.json()).then(d => setStreams(Array.isArray(d) ? d : [])).catch(() => {});
  }, [country]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">🔴 Active Livestreams</h1>
      <p className="text-gray-400 text-sm mb-6">Live broadcasts — {country}</p>
      <div className="space-y-3">
        {streams.map((s: any) => (
          <div key={s.id} className="bg-[#1E293B] rounded-xl p-5 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400">LIVE</span>
              {s.category === 'election' && <span className="text-xs px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded">Election</span>}
              <span className="text-xs text-gray-500 ml-auto">👁 {s.viewerCount || 0}</span>
            </div>
            <h3 className="font-medium text-gray-100">{s.title}</h3>
            <p className="text-xs text-gray-400 mt-1">{s.user?.displayName || 'Anonymous'} · Started {new Date(s.startedAt).toLocaleTimeString()}</p>
          </div>
        ))}
        {streams.length === 0 && (
          <div className="text-center py-16 bg-[#1E293B] rounded-xl border border-gray-700">
            <p className="text-4xl mb-3">📺</p>
            <p className="text-gray-400">No active livestreams right now</p>
          </div>
        )}
      </div>
    </div>
  );
}
