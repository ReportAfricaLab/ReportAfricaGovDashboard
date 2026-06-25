'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';

export default function BusinessesPage() {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');

  const load = () => adminAPI.businesses(1, search || undefined).then(setData).catch(() => {});
  useEffect(() => { load(); }, [search]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🏪 Business Management</h1>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search business name..."
        className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 mb-6 outline-none focus:border-emerald-500" />
      <div className="space-y-3">
        {data?.businesses?.map((b: any) => (
          <div key={b.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{b.name}</h3>
                {b.isVerified && <span className="text-[10px] px-2 py-0.5 bg-emerald-600/20 text-emerald-400 rounded font-bold">VERIFIED</span>}
                <span className="text-[10px] px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded capitalize">{b.subscriptionTier}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{b.category} · {b.city || b.state || ''} · {b.country} · Owner: {b.ownerId?.slice(0,8)}</p>
            </div>
            <div className="flex gap-2">
              {!b.isVerified && <button onClick={() => adminAPI.updateBusiness(b.id, { isVerified: true }).then(load)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-500">Verify</button>}
              <button onClick={() => adminAPI.updateBusiness(b.id, { isActive: !b.isActive }).then(load)} className={`px-3 py-1.5 text-xs rounded ${b.isActive ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-gray-600 text-white hover:bg-gray-500'}`}>
                {b.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
        {data?.businesses?.length === 0 && <p className="text-gray-500 text-center py-10">No businesses registered yet</p>}
      </div>
      {data && <p className="text-xs text-gray-500 mt-4">Total: {data.total}</p>}
    </div>
  );
}
