'use client';
import { useState, useEffect } from 'react';
import { govAPI } from '@/lib/api';
import { useJurisdiction } from '@/lib/useJurisdiction';

export default function TrendsPage() {
  const { country } = useJurisdiction();
  const [data, setData] = useState<any>(null);

  useEffect(() => { govAPI.trending(country).then(setData).catch(() => {}); }, [country]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">📈 Trends</h1>
      <p className="text-gray-400 text-sm mb-6">Trending reports and patterns — {country}</p>
      <div className="space-y-3">
        {data?.trending?.map((r: any, i: number) => (
          <a key={r.id || i} href={`/report/${r.id}`} className="block bg-[#1E293B] rounded-xl p-5 border border-gray-700 hover:border-blue-500 transition">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-gray-500 w-8">#{i + 1}</span>
              <div className="flex-1">
                <h3 className="font-medium text-gray-100">{r.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{r.category} · {r.severity} · ↑{r.upvotes} · 💬{r.commentCount}</p>
              </div>
              <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
          </a>
        ))}
        {(!data?.trending || data.trending.length === 0) && <p className="text-gray-500 text-center py-12">No trending data available</p>}
      </div>
    </div>
  );
}
