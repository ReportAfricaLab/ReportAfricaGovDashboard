'use client';
import { useState, useEffect } from 'react';
import { govAPI } from '@/lib/api';
import { useJurisdiction } from '@/lib/useJurisdiction';

export default function HotspotsPage() {
  const { country } = useJurisdiction();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => { govAPI.hotspots(country).then((d: any) => setData(Array.isArray(d) ? d : d.data || [])).catch(() => {}); }, [country]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">🔥 Hotspot Areas</h1>
      <p className="text-gray-400 text-sm mb-6">Areas with highest incident density — {country}</p>
      <div className="grid grid-cols-2 gap-4">
        {data.map((h: any, i: number) => (
          <div key={i} className="bg-[#1E293B] rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-100">{h.state || h.city || 'Unknown'}</h3>
              <span className="text-xs px-2 py-0.5 bg-red-600/20 text-red-400 rounded capitalize">{h.category?.replace('_', ' ') || h.type}</span>
            </div>
            <p className="text-3xl font-bold text-orange-400">{h.count || h.reportCount || 0}</p>
            <p className="text-xs text-gray-500">reports</p>
          </div>
        ))}
        {data.length === 0 && <p className="text-gray-500 text-center py-12 col-span-2">No hotspots detected</p>}
      </div>
    </div>
  );
}
