'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';

export default function ModerationPage() {
  const [data, setData] = useState<any>(null);

  const load = () => adminAPI.moderationQueue().then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">⚠️ Moderation Queue</h1>
      <p className="text-sm text-gray-400 mb-6">AI-flagged content that needs manual review</p>

      <div className="space-y-3">
        {data?.reports?.map((r: any) => (
          <div key={r.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 bg-red-600 text-white rounded font-bold">FLAGGED</span>
                  <span className="text-xs text-gray-500 capitalize">{r.category}</span>
                </div>
                <h3 className="font-medium text-gray-100">{r.title}</h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{r.description}</p>
                <p className="text-xs text-gray-600 mt-2">By: {r.author?.username || 'Anonymous'} · {new Date(r.createdAt).toLocaleDateString()}</p>
                {r.aiFlags && <p className="text-xs text-red-400 mt-1">AI Flags: {r.aiFlags}</p>}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => adminAPI.verifyReport(r.id, 'community_verified').then(load)}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-500">Approve</button>
                <button onClick={() => adminAPI.deleteReport(r.id).then(load)}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-500">Remove</button>
              </div>
            </div>
          </div>
        ))}
        {(!data?.reports || data.reports.length === 0) && <p className="text-gray-500 text-center py-10">No items in moderation queue</p>}
      </div>
    </div>
  );
}
