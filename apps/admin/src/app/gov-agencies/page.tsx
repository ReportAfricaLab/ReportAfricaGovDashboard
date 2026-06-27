'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';

export default function GovAgenciesPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const load = () => {
    adminAPI.govPending().then(setPending).catch(() => {});
    adminAPI.govAll().then(setApproved).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    await adminAPI.govApprove(id);
    setMessage('✅ Agency approved');
    load();
    setTimeout(() => setMessage(''), 3000);
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this agency registration?')) return;
    await adminAPI.govReject(id);
    setMessage('❌ Agency rejected');
    load();
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🏛️ Gov Agency Management</h1>
      {message && <div className="mb-4 p-3 rounded-lg bg-gray-800 border border-gray-700 text-sm">{message}</div>}

      <h2 className="font-semibold text-amber-400 mb-3">Pending Approval ({pending.length})</h2>
      <div className="space-y-2 mb-8">
        {pending.map((u: any) => (
          <div key={u.id} className="bg-gray-800 rounded-xl border border-amber-700/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium">{u.displayName || u.username}</p>
                <p className="text-xs text-gray-400">{u.email} · Registered {new Date(u.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select id={`country-${u.id}`} defaultValue="NG" className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200">
                <option value="NG">Nigeria</option><option value="GH">Ghana</option><option value="KE">Kenya</option><option value="ZA">South Africa</option><option value="UG">Uganda</option>
              </select>
              <input id={`state-${u.id}`} placeholder="State (optional)" className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 w-32" />
              <button onClick={() => {
                const country = (document.getElementById(`country-${u.id}`) as HTMLSelectElement)?.value || 'NG';
                const state = (document.getElementById(`state-${u.id}`) as HTMLInputElement)?.value || '';
                adminAPI.govApprove(u.id, country, state).then(() => { setMessage('✅ Agency approved'); load(); }).catch((e: any) => setMessage('❌ ' + e.message));
                setTimeout(() => setMessage(''), 3000);
              }} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-500">Approve</button>
              <button onClick={() => handleReject(u.id)} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-500">Reject</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-gray-500 text-sm">No pending registrations</p>}
      </div>

      <h2 className="font-semibold text-emerald-400 mb-3">Approved Agencies ({approved.length})</h2>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-750 border-b border-gray-700">
            <tr className="text-left text-gray-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {approved.map((u: any) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.displayName || u.username}</td>
                <td className="px-4 py-3 text-gray-400">{u.email}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
