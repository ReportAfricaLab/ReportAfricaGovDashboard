'use client';
import { useState, useEffect } from 'react';
import { govAPI } from '@/lib/api';

export default function GovDashboard() {
  const [data, setData] = useState<any>(null);
  const [country, setCountry] = useState('NG');
  const [state, setState] = useState('');
  const [mapReports, setMapReports] = useState<any[]>([]);

  useEffect(() => { govAPI.dashboard(country, state || undefined).then(setData).catch(() => {}); }, [country, state]);
  useEffect(() => { govAPI.mapData(country, state || undefined).then((d: any) => setMapReports(d.data || [])).catch(() => {}); }, [country, state]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Civic Intelligence Overview</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time incident monitoring</p>
        </div>
        <select value={country} onChange={(e) => setCountry(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none">
          {[
            { code: 'NG', name: 'Nigeria' }, { code: 'GH', name: 'Ghana' }, { code: 'KE', name: 'Kenya' },
            { code: 'ZA', name: 'South Africa' }, { code: 'UG', name: 'Uganda' }, { code: 'RW', name: 'Rwanda' },
            { code: 'TZ', name: 'Tanzania' }, { code: 'ET', name: 'Ethiopia' }, { code: 'SN', name: 'Senegal' },
            { code: 'CM', name: 'Cameroon' }, { code: 'EG', name: 'Egypt' }, { code: 'MA', name: 'Morocco' },
            { code: 'DZ', name: 'Algeria' }, { code: 'TN', name: 'Tunisia' }, { code: 'CI', name: "Côte d'Ivoire" },
            { code: 'AO', name: 'Angola' }, { code: 'MZ', name: 'Mozambique' }, { code: 'CD', name: 'DR Congo' },
            { code: 'SD', name: 'Sudan' }, { code: 'LY', name: 'Libya' }, { code: 'ZW', name: 'Zimbabwe' },
            { code: 'ZM', name: 'Zambia' }, { code: 'MW', name: 'Malawi' }, { code: 'BJ', name: 'Benin' },
            { code: 'TG', name: 'Togo' }, { code: 'ML', name: 'Mali' }, { code: 'BF', name: 'Burkina Faso' },
            { code: 'NE', name: 'Niger' }, { code: 'SL', name: 'Sierra Leone' }, { code: 'LR', name: 'Liberia' },
            { code: 'SO', name: 'Somalia' }, { code: 'MG', name: 'Madagascar' },
          ].map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <input value={state} onChange={(e) => setState(e.target.value)} placeholder="Filter by state/region..."
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none ml-2 w-48" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Reports', value: data?.totalReports || 0, color: 'text-blue-400' },
          { label: 'Total Users', value: data?.totalUsers || 0, color: 'text-emerald-400' },
          { label: 'Emergency Reports', value: data?.emergencyReports || 0, color: 'text-red-400' },
          { label: 'Active Incidents', value: data?.activeReports || 0, color: 'text-orange-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1E293B] rounded-xl p-5 border border-gray-700">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
          <h2 className="font-semibold mb-4">Category Breakdown</h2>
          {data?.categoryBreakdown?.length > 0 ? (
            <div className="space-y-2">
              {data.categoryBreakdown.map((cat: any) => (
                <div key={cat.category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-300 capitalize">{cat.category.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold text-blue-400">{cat.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data available</p>
          )}
        </div>

        <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
          <h2 className="font-semibold mb-4">Recent Reports</h2>
          {data?.recentReports?.length > 0 ? (
            <div className="space-y-3">
              {data.recentReports.map((r: any) => (
                <div key={r.id} className="border-b border-gray-700 pb-2 last:border-0">
                  <p className="text-sm font-medium text-gray-200 line-clamp-1">{r.title}</p>
                  <p className="text-xs text-gray-500">{r.category} · {r.severity}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent reports</p>
          )}
        </div>
      </div>

      {/* Incident Map */}
      <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700 mt-6">
        <h2 className="font-semibold mb-4">🗺️ Incident Map ({mapReports.length} reports)</h2>
        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
          {mapReports.length > 0 ? mapReports.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.severity === 'critical' ? 'bg-red-500' : r.severity === 'high' ? 'bg-orange-500' : 'bg-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">{r.title}</p>
                <p className="text-[10px] text-gray-500">{r.category} · {r.state || r.city || ''} · {r.latitude ? `${Number(r.latitude).toFixed(3)}, ${Number(r.longitude).toFixed(3)}` : 'No coords'}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${r.severity === 'critical' ? 'bg-red-600 text-white' : r.severity === 'high' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'}`}>{r.severity}</span>
            </div>
          )) : <p className="text-gray-500 text-sm text-center py-8">No incidents to display</p>}
        </div>
      </div>
    </div>
  );
}
