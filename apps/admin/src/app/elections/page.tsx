'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';

export default function ElectionsAdminPage() {
  const [data, setData] = useState<any>(null);

  const load = () => adminAPI.elections().then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🗳️ Election Reports</h1>
      <div className="space-y-3">
        {data?.reports?.map((r: any) => (
          <div key={r.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${r.type === 'violence' ? 'bg-red-600' : r.type === 'result_upload' ? 'bg-green-600' : 'bg-orange-600'}`}>{r.type?.replace('_', ' ').toUpperCase()}</span>
                  {r.state && <span className="text-xs text-gray-400">{r.state}</span>}
                  {r.isVerifiedObserver && <span className="text-[10px] text-emerald-400 font-bold">✓ OBSERVER</span>}
                </div>
                <p className="text-sm text-gray-200 mt-1">{r.description || r.electionName}</p>
                <p className="text-xs text-gray-500 mt-1">By: {r.user?.displayName || 'Anonymous'} · {new Date(r.createdAt).toLocaleString()}</p>
              </div>
              {!r.isVerifiedObserver && (
                <button onClick={() => adminAPI.verifyObserver(r.id).then(load)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-500">Mark Observer</button>
              )}
            </div>
          </div>
        ))}
        {data?.reports?.length === 0 && <p className="text-gray-500 text-center py-10">No election reports</p>}
      </div>
    </div>
  );
}
