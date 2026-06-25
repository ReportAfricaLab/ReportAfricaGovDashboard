'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';

export default function ChallengesAdminPage() {
  const [data, setData] = useState<any>(null);

  const load = () => adminAPI.challenges().then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🎯 Promo Challenges</h1>
      <div className="space-y-3">
        {data?.challenges?.map((c: any) => (
          <div key={c.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{c.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${c.status === 'active' ? 'bg-emerald-600/20 text-emerald-400' : c.status === 'paid_out' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'}`}>{c.status.toUpperCase()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Product: {c.productName} · Pot: {c.currency} {Number(c.potAmount).toLocaleString()} · Entries: {c.entryCount} · Deadline: {new Date(c.deadline).toLocaleDateString()}</p>
              </div>
              {c.status === 'active' && (
                <button onClick={() => adminAPI.closeChallenge(c.id).then(load)} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-500">Force Close</button>
              )}
            </div>
          </div>
        ))}
        {data?.challenges?.length === 0 && <p className="text-gray-500 text-center py-10">No challenges yet</p>}
      </div>
    </div>
  );
}
