'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';

export default function TipsAdminPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { adminAPI.tips().then(setData).catch(() => {}); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">💰 Tips & Earnings</h1>

      {data?.stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-xs text-gray-400">Total Tips</p>
            <p className="text-2xl font-bold text-amber-400">{data.stats.totalTips}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-xs text-gray-400">Total Amount</p>
            <p className="text-2xl font-bold text-emerald-400">{data.stats.totalAmount?.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-xs text-gray-400">Platform Revenue</p>
            <p className="text-2xl font-bold text-yellow-400">{data.stats.platformRevenue?.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-750 border-b border-gray-700">
            <tr className="text-left text-gray-400">
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data?.tips?.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-750">
                <td className="px-4 py-3">{t.sender?.username || '—'}</td>
                <td className="px-4 py-3">{t.receiver?.username || '—'}</td>
                <td className="px-4 py-3 text-amber-400 font-medium">{t.amount}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{t.reportId ? 'Report' : t.livestreamId ? 'Live' : 'Direct'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data?.tips?.length === 0 && <p className="text-gray-500 text-center py-10">No tips yet</p>}
    </div>
  );
}
