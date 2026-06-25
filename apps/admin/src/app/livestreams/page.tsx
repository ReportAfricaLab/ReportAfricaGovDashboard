'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';

export default function LivestreamsAdminPage() {
  const [data, setData] = useState<any>(null);

  const load = () => adminAPI.livestreams().then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🔴 Livestream Management</h1>
      <div className="space-y-3">
        {data?.streams?.map((s: any) => (
          <div key={s.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${s.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                <h3 className="font-medium">{s.title}</h3>
                <span className="text-[10px] px-2 py-0.5 bg-gray-700 text-gray-300 rounded">{s.status}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">By: {s.user?.displayName || s.userId?.slice(0,8)} · {s.country} · Viewers: {s.viewerCount} · Started: {s.startedAt ? new Date(s.startedAt).toLocaleString() : '—'}</p>
            </div>
            {s.status === 'live' && (
              <button onClick={() => adminAPI.endLivestream(s.id).then(load)} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-500">Force End</button>
            )}
          </div>
        ))}
        {data?.streams?.length === 0 && <p className="text-gray-500 text-center py-10">No streams</p>}
      </div>
    </div>
  );
}
